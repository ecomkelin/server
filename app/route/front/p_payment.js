const Payment = require('../../controllers/front/p_payment/Payment');

const MdAuth = require('../../middle/middleAuth');

const bodyParser = require("body-parser");

module.exports = (app) => {

	/* ========================================== Payment ========================================== */
	
	/* -------------------------------------- stripe -------------------------------------- */
	app.post('/api/v1/create-checkout-session', MdAuth.path_Client, Payment.stripePayment);
	app.post('/api/v1/webhook', bodyParser.raw({type: 'application/json'}), Payment.webhook);

	/* -------------------------------------- paypel -------------------------------------- */
	app.post('/api/v1/create-order', MdAuth.path_Client, Payment.paypalPayment);
	app.post('/api/v1/check-order', Payment.paypalCheckout);

	/* -------------------------------------- weixin -------------------------------------- */
	app.post('/api/v1/wxPayment', MdAuth.path_Client,  Payment.wxPayment);
	app.post('/api/v1/wx_notify_url', Payment.wx_notify_url);

};