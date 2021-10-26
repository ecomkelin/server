const ShopDB = require('../../../models/auth/Shop');
const OrderDB = require('../../../models/order/Order');

const MdFilter = require('../../../middle/middleFilter');
const YOUR_DOMAIN = 'https://localhost:3000';

const stripe = require('stripe')(process.env.STRIPE_PRIVATE);
const endpointSecret = process.env.STRIPE_WEBHOOK;


exports.webhook = async(req, res) => {
	console.log("/vcccc1/webhook");
	console.log("/111");
	const payload = req.body;
	// console.log('payload', payload);
	const sig = req.headers['stripe-signature'];
	// console.log('sig', sig)

	let event;
	try {
		event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
	} catch(error) {
		console.log("2222", error)
		return res.json({status: 500, message: "[server] webhook Error"});
	}
	console.log('event', event)
	console.log('event type', event.type)
	if (event.type === 'checkout.session.completed') {
	  const session = event.data.object;

	  // Fulfill the purchase...
	  console.log("Fulfilling order", session);
	}
	console.log("success")
	res.json({status: 200});
}
exports.stripePayment = async(req, res) => {
	console.log("/v1/create-checkout-session")
	try{
		const payload = req.payload;

		const items_res = await getItems(req.body.OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		const {Shop, order_items} = items_res.data;
		// if(!Shop.stripe_key_private) return res.json({status: 400, message: "[server] 本商店没有写入 strip 的 key Private"});
		// const stripe = require('stripe')(Shop.stripe_key_private);

		
		const stripeSession = await stripe.checkout.sessions.create({
			line_items: order_items,
			payment_method_types: ['card', 'sofort'],
			mode: 'payment',
			success_url: `${YOUR_DOMAIN}/city/MI`,
			cancel_url: `${YOUR_DOMAIN}/cancel.html`,
		});
		res.json({status: 200, data: {url: stripeSession.url}});
	} catch(error) {
		console.log("stripePayment error", error);
		return res.json({status: 500, message: "[server] create-checkout-session Error"});
	}
}

const getItems = (OrderId, payload) => {
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
					const unit_amount = parseInt(OrderSku.price * 100);
					if(isNaN(unit_amount) || unit_amount <= 0) return resolve({status: 400, message: "[server] 订单中的某个产品价格错误"});
					if(isNaN(OrderSku.quantity) || OrderSku.quantity <= 0) return resolve({status: 400, message: "[server] 订单中的某个产品数量错误"});
					data.order_items.push({
						price_data: {
							currency: process.env.CURRENCY,
							product_data: {
								name: `${OrderProd.nome} ${OrderSku.attrs}`,
							},
							unit_amount,
						},
						quantity: OrderSku.quantity,
					})
				}
			}
			console.log("getItems 200")
			return resolve({status: 200, data});
		} catch(error) {
			console.log("getItems error", error);
			return resolve({status: 500, message: "getItems error"});
		}
	})
}