const ShopDB = require('../../../models/auth/Shop');
const OrderDB = require('../../../models/order/Order');

const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');



const paypal = require("@paypal/checkout-server-sdk");
const payPalClient = require('./paypal/payPalClient');

exports.paypalPayment =  async (req, res) => {
	console.log("/v1/paypalPayment");
	try {
		const payload = req.payload;
		const OrderId = req.body.OrderId;
		const items_res = await getSkus_Prom(OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		const {order_items, Order} = items_res.data;
		console.log(1)
		console.log(order_items)

		const total = order_items.reduce((sum, item) => {
			return sum + item.price * item.quantity
		}, 0);
		console.log(2, total)
		const items = order_items.map(item => {
			return {
				name: item.desp,
				unit_amount: {
					currency_code: process.env.CURRENCY,
					value: item.price,
				},
				quantity: item.quantity,
			}
		});
		const purchase_units = [{
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
			items,
		}];

		console.log(3, purchase_units)
		const request = new paypal.orders.OrdersCreateRequest();
		console.log(4)
		request.prefer("return=representation")
		request.requestBody({
			intent: "CAPTURE",
			purchase_units,
			application_context: {
				return_url: `${process.env.YOUR_DOMAIN}/order/${OrderId}`,
			    cancel_url: `${process.env.YOUR_DOMAIN}/order/${OrderId}?error=1`,
			},
		});
		console.log(5)
		const order = await payPalClient.client().execute(request);
		console.log(6)
		if(!order) return resolve({status: 400, message: "[server] paypalClient.execute Error"});

		console.log(7)
		Order.paypal_orderId = order.result.id;
		const OrderSave = await Order.save();
		if(!OrderSave) return resolve({status: 400, message: "[server] paypalClient OrderSave Error"});

		console.log(8)
		return res.json({status: 200, data: {id: order.result.id}});
	} catch (e) {
		console.log("paypaylPayment error:   -------", e)
		return res.json({ error: e.message })
	}
}

exports.paypalCheckout = async(req, res) => {
	console.log("/v1/paypalCheckout");
	try {
		const paypal_orderId = req.body.paypal_orderId;
		const OrderId = req.body.OrderId;

		console.log(1)
		const Order = await OrderDB.findOne({_id: OrderId});
		if(!Order) return res.json({status: 400, message: "[server] 没有找到此订单"});
		console.log(2)
		if(Order.paypal_orderId !== paypal_orderId) return res.json({status: 400, message: "[server] 付款信息不是此订单的"});

		const checkRequest = new paypal.orders.OrdersCaptureRequest(paypal_orderId);
		checkRequest.requestBody({});
		
		console.log(3)
		const checkOrder = await payPalClient.client().execute(checkRequest);
		console.log(checkOrder);
		Order.status = ConfOrder.status_obj.responding.num;
		console.log(4)
		const OrderSave = await Order.save();
		if(!OrderSave) return res.json({status: 400, message: "[server] paypalCheckout OrderSave Error"});
		console.log(5)
		return res.json({ status: 200 })
	} catch (error) {
		console.log("paypalCheckout error:   -------", error);
		return res.json({ status: 400, message: "付款失败" });
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
			success_url: `${process.env.YOUR_DOMAIN}/order/${OrderId}`,
			cancel_url: `${process.env.YOUR_DOMAIN}/order/${OrderId}?error=1`,
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
			const data = {Shop: null, Order: null, order_items: []};

			if(!MdFilter.is_ObjectId_Func(OrderId)) return resolve({status: 400, message: "[server] 请传递正确的 Order _id 信息"});
			const Order = await OrderDB.findOne({_id: OrderId, Client: payload._id})
				.populate({path: "Shop"})
				.populate({path: "OrderProds", select: "OrderSkus nome", populate: {
					path: "OrderSkus", select: "price quantity attrs"
				}})
			if(!Order) return resolve({status: 400, message: "[server] 没有找到 Order"});
			data.Order = Order;
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
			return resolve({status: 200, data});
		} catch(error) {
			console.log("getSkus error", error);
			return resolve({status: 500, message: "getSkus error"});
		}
	})
}