const Order = require('../../controllers/front/i_order/Order');
const Order_status = require('../../controllers/front/i_order/Order_status');

const payment = require('../../controllers/front/i_order/payment');

const MdAuth = require('../../middle/middleAuth');

const bodyParser = require("body-parser");

module.exports = (app) => {
	
	/* ============================== Order ============================== */
	app.post('/api/v1/Order', MdAuth.path_Client, Order.vOrderPost);
	app.get('/api/v1/Orders', MdAuth.path_Client, Order.vOrders);
	app.put('/api/v1/Order/:id', MdAuth.path_Client, Order.vOrderPut);

	// app.put('/api/v1/Order_proof/:id', MdAuth.path_Client, Order_status.vOrder_proof);		// 订单商品及Sku校准
	app.put('/api/v1/Order_change_status/:id', MdAuth.path_Client, Order_status.vOrder_change_status);

	app.post('/api/v1/create-checkout-session', MdAuth.path_Client, payment.stripePayment);
	app.post('/api/v1/webhook', bodyParser.raw({type: 'application/json'}), async(req, res) => {
		console.log("/v1/webhook");
		const payload = req.body;
		console.log('payload', payload);
		const sig = req.headers['stripe-signature'];
		console.log('sig', sig)

		let event;
		try {
			event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
		} catch(error) {
			return res.json({status: 500, message: "[server] webhook Error"});
		}
		// if (event.type === 'checkout.session.completed') {
		//   const session = event.data.object;

		//   // Fulfill the purchase...
		//   console.log("Fulfilling order", session);
		// }
		console.log("success")
		res.json({status: 200});
	})

};