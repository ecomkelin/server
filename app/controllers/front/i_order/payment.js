const ShopDB = require('../../../models/auth/Shop');
const OrderDB = require('../../../models/order/Order');

const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const YOUR_DOMAIN = 'https://localhost:3000';





exports.paypalPayment =  async (req, res) => {
	console.log("/v1/paypalPayment");
	try {

		const payload = req.payload;
		const OrderId = req.body.OrderId;
		const items_res = await getSkus_Prom(OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		const {Shop, order_items} = items_res.data;

		const total = order_items.reduce((sum, item) => {
			return sum + item.price * item.quantity
		}, 0);
		const purchase_units = order_items.map((item) => {
			return {
				amount: {
					currency_code: process.env.CURRENCY,
					value: total,
					breakdown: {
						item_total: {
							currency_code: process.env.CURRENCY,
							value: total,
						},
					},
				},
				items: order_items.map(item => {
					return {
						name: item.desp,
						unit_amount: {
							currency_code: process.env.CURRENCY,
							value: item.price,
						},
						quantity: item.quantity,
					}
				}),
			}
		})

		const paypal = require("@paypal/checkout-server-sdk")
		const Environment =
		  process.env.NODE_ENV === "production"
		    ? paypal.core.LiveEnvironment
		    : paypal.core.SandboxEnvironment


		const paypalClient = new paypal.core.PayPalHttpClient(
		  new Environment(
		    process.env.PAYPAL_CLIENT_ID,
		    process.env.PAYPAL_CLIENT_SECRET
		  )
		)


		const request = new paypal.orders.OrdersCreateRequest()

		request.prefer("return=representation")
		request.requestBody({
			intent: "CAPTURE",
			purchase_units,
			// application_context: {
			// 	return_url: `${YOUR_DOMAIN}/order/${OrderId}`,
			// 	cancel_url: `${YOUR_DOMAIN}/order/${OrderId}?error=1`,
			// }
		});

		const order = await paypalClient.execute(request);
		if(!order) return res.json({status: 400, message: "paypalClient.execute Error"})
		console.log('purchase_units', order.result.purchase_units[0])
		console.log("paypaylPayment successs")
		return res.json({ status: 200, data: {id: order.result.id} })
	} catch (e) {
		console.log("paypaylPayment error:   -------", e)
		return res.json({ error: e.message })
	}
}




































exports.webhook = async(req, res) => {
	console.log("/v1/webhook");
	try {
		const payload = req.body;

		/* ===================== stripe 检验环节 kelin ===================== */
		// const Stripe = require('stripe')(process.env.STRIPE_PRIVATE);
		// const sig = req.headers['stripe-signature'];
		// const endpointSecret = process.env.STRIPE_WEBHOOK;
		// let event = Stripe.webhooks.constructEvent(payload, sig, endpointSecret);
		// console.log('event type', event.type)
		/* ===================== stripe 检验环节 kelin ===================== */

		if (payload.type === 'checkout.session.completed') {
			const session = payload.data.object;
			// console.log("session", session)
			// amount_subtotal: 500,
			// amount_total: 700,
			// total_details: { amount_discount: 0, amount_shipping: 200, amount_tax: 0 },

			const OrderId = session.metadata.OrderId;
			const Order = await OrderDB.findOne({_id: OrderId});
			Order.status = ConfOrder.status_obj.responding.num;
			Order.is_paid = true;
			const OrderSave = await Order.save();
		}
		console.log("success")
		return res.json({status: 200});
	} catch(error) {
		return res.json({status: 500, message: "[server] webhook Error"});
	}
}

exports.stripePayment = async(req, res) => {
	console.log("/v1/create-checkout-session")
	try{
		const payload = req.payload;
		const OrderId = req.body.OrderId;
		const items_res = await getSkus_Prom(OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		const {Shop, order_items} = items_res.data;
		const line_items = order_items.map( item => {
			const unit_amount = parseInt(item.price * 100);
			return {
				price_data: {
					currency: process.env.CURRENCY,
					product_data: {
						name: item.desp,
					},
					unit_amount,
				},
				quantity: item.quantity,
			}
		})
		// if(!Shop.stripe_key_private) return res.json({status: 400, message: "[server] 本商店没有写入 strip 的 key Private"});
		// const stripe = require('stripe')(Shop.stripe_key_private);

		const Stripe = require('stripe')(process.env.STRIPE_PRIVATE);

		const email = payload.email;
		const customer = await Stripe.customers.create({
			email,
		});

		const stripeSession = await Stripe.checkout.sessions.create({
			line_items,
			shipping_rates: ["shr_1JpCbzJIPg2MUXJXFTAgCaFt"],
			// shipping_address_collection: {
			// 	allowed_countries: ["IT"]
			// },
			payment_method_types: ['card', 'sofort'],
			mode: 'payment',
			success_url: `${YOUR_DOMAIN}/order/${OrderId}`,
			cancel_url: `${YOUR_DOMAIN}/order/${OrderId}?error=1`,
			metadata: {
				OrderId,
				stripe_key_private: '',
				endpointSecret: '',
			},
			customer: customer.id,
		});
		return res.json({status: 200, data: {url: stripeSession.url}});
	} catch(error) {
		console.log("stripePayment error", error);
		return res.json({status: 500, message: "[server] create-checkout-session Error"});
	}
}
















const getSkus_Prom = (OrderId, payload) => {
	return new Promise(async(resolve) => {
		try{
			const data = {Shop: null, order_items: []};

			if(!MdFilter.is_ObjectId_Func(OrderId)) return resolve({status: 400, message: "[server] 请传递正确的 Order _id 信息"});
			const Order = await OrderDB.findOne({_id: OrderId, Client: payload._id})
				.populate({path: "Shop"})
				.populate({path: "OrderProds", select: "OrderSkus nome", populate: {
					path: "OrderSkus", select: "price quantity attrs"
				}})
			if(!Order) return resolve({status: 400, message: "[server] 没有找到 Order"});
			if(!Order.Shop) return resolve({status: 400, message: "[server] 没有找到 Order中的Shop"});
			data.Shop = Order.Shop;
			if(!Order.OrderProds) return resolve({status: 400, message: "[server] 没有找到 Order中的 OrderProds"});

			for(let i=0; i<Order.OrderProds.length; i++) {
				const OrderProd = Order.OrderProds[i];
				if(!OrderProd.OrderSkus) return resolve({status: 400, message: "[server] 没有找到 Order中的 OrderProds"});
				for(let j=0; j<OrderProd.OrderSkus.length; j++) {
					const OrderSku = OrderProd.OrderSkus[j];
					const price = parseFloat(OrderSku.price);
					if(isNaN(price) || price <= 0) return resolve({status: 400, message: "[server] 订单中的某个产品价格错误"});
					const quantity = OrderSku.quantity
					if(isNaN(quantity) || quantity <= 0) return resolve({status: 400, message: "[server] 订单中的某个产品数量错误"});
					data.order_items.push({
						desp: `${OrderProd.nome} ${OrderSku.attrs}`,
						price,
						quantity,
					})
				}
			}
			console.log("getSkus 200")
			return resolve({status: 200, data});
		} catch(error) {
			console.log("getSkus error", error);
			return resolve({status: 500, message: "getSkus error"});
		}
	})
}