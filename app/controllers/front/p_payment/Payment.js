const OrderDB = require('../../../models/order/Order');

const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');





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
			Order.type_paid = ConfOrder.type_paid_obj.strip.num;
			Order.is_paid = true;
			const OrderSave = await Order.save();
		}
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
		const success_url = req.body.success_url;
		const cancel_url = req.body.cancel_url;
		if(!success_url || !cancel_url) return res.json({status: 400, message: "[server] 请传递付款成功和失败的跳转url"});
		const preStr = "https://"
		for(let i=0; i<preStr.length; i++) {
			if(success_url[i] !== preStr[i] || cancel_url[i] !== preStr[i]) return res.json({status: 400, message: "[server] 跳转url必须以 https:// 开头"});
		}

		const items_res = await getSkus_Prom(OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		const {Shop, order_items} = items_res.data;
		const line_items = order_items.map( item => {
			const unit_amount = parseInt(item.price_sale * 100);
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
			success_url,
			cancel_url,
			// success_url: `${process.env.YOUR_DOMAIN}/order/${OrderId}`,
			// cancel_url: `${process.env.YOUR_DOMAIN}/order/${OrderId}?error=1`,
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

		/* ----- paypal 的数据格式 ----- */
		const orderPayValue = order_items.reduce((sum, item) => {
			return sum + item.price_sale * item.quantity
		}, 0);
		const items = order_items.map(item => {
			return {
				name: item.desp,
				unit_amount: {
					currency_code: process.env.CURRENCY,
					value: item.price_sale,
				},
				quantity: item.quantity,
			}
		});
		const purchase_units = [{
			amount: {
				currency_code: process.env.CURRENCY,
				value: orderPayValue,
				breakdown: {
					item_total: {
						currency_code: process.env.CURRENCY,
						value: orderPayValue,
					},
				},
			},
			items,
		}];
		/* ----- paypal 的数据格式 ----- */

		const request = new paypal.orders.OrdersCreateRequest();
		request.prefer("return=representation")
		request.requestBody({
			intent: "CAPTURE",
			purchase_units,
		});
		const order = await payPalClient.client().execute(request);
		if(!order) return resolve({status: 400, message: "[server] paypalClient.execute Error"});

		Order.paypal_orderId = order.result.id;
		const OrderSave = await Order.save();
		if(!OrderSave) return resolve({status: 400, message: "[server] paypalClient OrderSave Error"});

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

		const Order = await OrderDB.findOne({_id: OrderId});
		if(!Order) return res.json({status: 400, message: "[server] 没有找到此订单"});
		if(Order.paypal_orderId !== paypal_orderId) return res.json({status: 400, message: "[server] 付款信息不是此订单的"});

		const checkRequest = new paypal.orders.OrdersCaptureRequest(paypal_orderId);
		checkRequest.requestBody({});
		
		const checkOrder = await payPalClient.client().execute(checkRequest);
		Order.status = ConfOrder.status_obj.responding.num;
		Order.type_paid = ConfOrder.type_paid_obj.paypal.num;
		Order.is_paid = true;
		const OrderSave = await Order.save();
		if(!OrderSave) return res.json({status: 400, message: "[server] paypalCheckout OrderSave Error"});
		return res.json({ status: 200 })
	} catch (error) {
		console.log("paypalCheckout error:   -------", error);
		return res.json({ status: 400, message: "付款失败" });
	}
}









const axios = require('axios');
const fs = require('fs');
const path = require('path');
const PRIMARY_PEM = fs.readFileSync(path.join(__dirname, './weixin/XXX_key.pem'));
const { v4: uuidv4 } = require('uuid');
const appid = process.env.WX_APPID;
const mchid = process.env.WX_MCHID_XXX;
const notify_url = process.env.NOTIFY_URL;
const MD5 = require('md5');
const ClientDB = require('../../../models/auth/Client');

exports.wxPayment =  async (req, res) => {
	console.log('/v1/wxPayment');
	try {
		let payload = req.payload;
		
		const Client = await ClientDB.findOne({_id: payload._id});
		if(!Client) return res.json({status: 400, message: "没有找到客户"});
		const {socials} = Client;
		if(socials.length < 1) return res.json({status: 400, message: "没有用第三方登录"});
		let openid = null;
		// console.log(socials);
		for(let i=0; i<socials.length; i++) {
			let social = socials[i];
			if(social.social_type === 'wx') {
				openid = social.social_id;
				break;
			}
		}

		if(!openid) return res.json({status: 400, message: 'openid error'});
		console.log(111, openid)
		let {OrderId} = req.body;
		let items_res = await getSkus_Prom(OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		let {order_items, Order} = items_res.data;
		let out_trade_no = Order._id;
		let total_fee = parseInt(Order.total_sale*100);
		console.log(222, total_fee)
		/* ======== 读取服务商接口 ============= */
		let service = 'pay.weixin.jspay';							// 7
		let mch_id = mchid;											// 4
		let is_raw = 1;												// 2
		// let out_trade_no = Order._id;							// 11
		let body = 'body_description';								// 1
		let sub_openid = openid;									// 9 	oz0WQ5FKV39_48Lf4Rcyo6Ux2TrY
		let sub_appid = appid;										// 8	wx48c5ff852226c6ff
		// let total_fee = 1;										// 10
		let mch_create_ip = '66.249.79.131';						// 3
		// let notify_url = process.env.NOTIFY_URL					// 6 	https://unioncityitaly.com
		let nonce_str = uuidv4().replace(/-/g, '').substr(0,16);	// 5  	1277e4e29f4240d2
		let stringA = 'body='+body
			stringA += '&is_raw='+is_raw
			stringA += '&mch_create_ip='+mch_create_ip
			stringA += '&mch_id='+mch_id
			stringA += '&nonce_str='+nonce_str
			stringA += '&notify_url='+notify_url
			stringA += '&out_trade_no='+out_trade_no
			stringA += '&service='+service
			stringA += '&sub_appid='+sub_appid
			stringA += '&sub_openid='+sub_openid
			stringA += '&total_fee='+total_fee;

		let key = '8534c0fa8924251a5d279e25e61e33f7';
		let stringSignTemp = stringA+'&key='+key;
		let sign = MD5(stringSignTemp).toUpperCase();
		console.log(333, sign);
		let xmls = `
		<xml>
		    <body>${body}</body>
		    <is_raw>${is_raw}</is_raw>
		    <mch_create_ip>${mch_create_ip}</mch_create_ip>
		    <mch_id>${mch_id}</mch_id>
		    <nonce_str>${nonce_str}</nonce_str>
		    <notify_url>${notify_url}</notify_url>
		    <out_trade_no>${out_trade_no}</out_trade_no>
		    <service>${service}</service>
		    <sub_appid>${sub_appid}</sub_appid>
		    <sub_openid>${sub_openid}</sub_openid>
		    <total_fee>${total_fee}</total_fee>
		    <sign>${sign}</sign>
		</xml>
		`
		let result = await axios.post(
			'https://pay.wepayez.com/pay/gateway', 
			xmls, 
			{
				headers: {'Content-Type': 'text/xml'}
			}
		);

		let {data} = result;
		let pay_info = data.split('pay_info');
		if(pay_info.length < 2) return res.json({status: 400, message: "付款失败 1"});
		pay_info = pay_info[1].split('><![CDATA[');
		if(pay_info.length < 2) return res.json({status: 400, message: "付款失败 2"});
		pay_info = pay_info[1].split(']]><');
		if(pay_info.length < 2) return res.json({status: 400, message: "付款失败 3"});
		pay_info=JSON.parse(pay_info[0]);

		console.log(444, pay_info)
		return res.json({status: 200, data: {...pay_info}});
	} catch (e) {
		console.log("paypaylPayment error:   -------", e)
		return res.json({ error: e.message })
	}
}
exports.wxPaymentSuccess = async(req, res) => {
	try {
		let payload = req.payload;
		let {OrderId} = req.body;
		let Order = await OrderDB.findOne({_id: OrderId});
		if(!Order) return res.json({status: 400, message: "没有找到订单"});

		/* === 前端权限 === */
		Order.status = ConfOrder.status_obj.responding.num;
		Order.type_paid = ConfOrder.type_paid_obj.wx.num;
		Order.is_paid = true;
		const OrderSave = await Order.save();
		if(!OrderSave) return res.json({status: 400, message: "[server] wxPaymentSuccess OrderSave Error"});
		/* === 前端权限 === */

		return res.json({ status: 200});
	} catch(err) {
		return res.json({status: 500, error: err.message})
	}
}

exports.wx_notify_url = async(req, res) => {
	console.log("/v1/wx_notify_url");
	try {
		/* ===== 查询订单的正确性 ===== */
		// let {xml} = req.body;
		// let {out_trade_no , transaction_id} = xml;
		/* *
		let url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/
		url += out-trade-no/'+out_trade_no;
		url += id/'+transaction_id;
		url += +'?mchid='+appid;

		let result = await axios.get(url);
		let OrderId = result.out-trade-no;
		let Order = await OrderDB.findOne({_id: OrderId});
		if(!Order) return res.json({status: 400, message: "没有找到到Order"});
		Order.status = ConfOrder.status_obj.responding.num;
		let OrderSave = await Order.save();
		if(!OrderSave) return res.json({status: 400, message: "业务更改失败"});
		*/
		/* ===== 查询订单的正确性 ===== */

		res.header("Content-Type", "application/xml");
		return res.status(200).send('success');
	} catch(err) {
		res.header("Content-Type", "application/xml");
		return res.status(500).send('fail');
	}
}



exports.wxPayment_simple =  async(req, res) => {
	console.log("/v1/wxPayment");
	try{
		let {openid} = req.body;

		let serial_no = 'XXX';
		let description = out_trade_no = 'Order_id';
		let total = 1;
		let currency_XXX = 'CNY';

		let bodyPrepay = {
			appid, mchid, description, out_trade_no, notify_url,
			amount: {
				total,
				currency: currency_XXX
			},
			payer: {
				openid
			},
		};

		let timestamp = Date.now();
		let nonce_str = uuidv4();
		let msgAuth = `POST\n
			/v3/pay/transactions/jsapi\n
			${timestamp}\n
			${nonce_str}\n
			${JSON.stringify(bodyPrepay)}\n`
		// 签名 msgAuth, PRIMARY_PEM
		let signature = sign(msgAuth, PRIMARY_PEM);

		let result = await axios.post(
			'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', 
			bodyPrepay, 
			{
				headers: {
					Authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",serial_no="${serial_no}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}`
				}
			}
		)

		const {prepay_id} = result.data;
		const package = `prepay_id=${prepay_id}`;
		return res.json({status: 200, data: {
			timestamp: String(timestamp),
			nonceStr: nonce_str,
			package,
			signType: 'RSA',
			paySign: `${appid}\n${timestamp}\n${nonce_str}\n${package}\n`,
			
		}})
	} catch(err) {
		console.log(err);
		return res.json({status: 500})
	}
};

const {createSign} = require('crypto');
const sign = (message, privateKey) => {
    return createSign('sha256WithRSAEncryption').update(message).sign(
        privateKey,
        'base64',
    );
};


exports.wxPayment_b =  async (req, res) => {
	try {
		let payload = req.payload;
		
		let {OrderId, openid} = req.body;
		if(!openid) return res.json({status: 400, message: "没有传递openid"});

		let items_res = await getSkus_Prom(OrderId, payload);
		if(items_res.status !== 200) return res.json(items_res);
		let {order_items, Order} = items_res.data;

		let serial_no = 'XXX';
		let description = out_trade_no = 'Order_id';
		let total = 1;
		let currency_XXX = 'CNY';

		let bodyPrepay = {
			appid, mchid, description, out_trade_no, notify_url,
			amount: {
				total,
				currency: currency_XXX
			},
			payer: {
				openid
			},
		};

		let timestamp = Date.now();
		let nonce_str = uuidv4();
		let msgAuth = `POST\n
			/v3/pay/transactions/jsapi\n
			${timestamp}\n
			${nonce_str}\n
			${JSON.stringify(bodyPrepay)}\n`
		// 签名 msgAuth, PRIMARY_PEM
		let signature = sign(msgAuth, PRIMARY_PEM);

		let result = await axios.post(
			'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', 
			bodyPrepay, 
			{
				headers: {
					Authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",serial_no="${serial_no}",nonce_str="${nonce_str}",timestamp="${timestamp}",signature="${signature}`
				}
			}
		)

		const {prepay_id} = result.data;
		const package = `prepay_id=${prepay_id}`;
		return res.json({status: 200, data: {
			timestamp: String(timestamp),
			nonceStr: nonce_str,
			package,
			signType: 'RSA',
			paySign: `${appid}\n${timestamp}\n${nonce_str}\n${package}\n`,
			
		}})
	} catch (e) {
		console.log("paypaylPayment error:   -------", e)
		return res.json({ error: e.message })
	}
}




















/* 根据 订单_id 找到相应订单 提取第三方支付需要的订单数据 */
const getSkus_Prom = (OrderId, payload) => {
	return new Promise(async(resolve) => {
		try{
			// stripe 和 payple 所需要的数据
			const data = {Shop: null, Order: null, order_items: []};

			// 找到相应 Order
			if(!MdFilter.is_ObjectId_Func(OrderId)) return resolve({status: 400, message: "[server] 请传递正确的 Order _id 信息"});
			const Order = await OrderDB.findOne({_id: OrderId, Client: payload._id})
				.populate({path: "Shop"})
				.populate({path: "OrderProds", select: "OrderSkus nome", populate: {
					path: "OrderSkus", select: "price_sale quantity attrs"
				}})
			if(!Order) return resolve({status: 400, message: "[server] 没有找到 Order"});

			const timeSpan = Date.now() - Order.at_confirm;
			if(timeSpan > ConfOrder.clientTime) {
				// Order.status = ConfOrder.status_obj.cancel.num;
				// const OrderSave = await Order.save();
				return resolve({status: 400, message: "[server] 付款超时 请重新下单"});
			}

			data.Order = Order;
			if(!Order.Shop) return resolve({status: 400, message: "[server] 没有找到 Order中的Shop"});
			data.Shop = Order.Shop;
			if(!Order.OrderProds) return resolve({status: 400, message: "[server] 没有找到 Order中的 OrderProds"});

			for(let i=0; i<Order.OrderProds.length; i++) {
				const OrderProd = Order.OrderProds[i];
				if(!OrderProd.OrderSkus) return resolve({status: 400, message: "[server] 没有找到 Order中的 OrderProds"});
				for(let j=0; j<OrderProd.OrderSkus.length; j++) {
					const OrderSku = OrderProd.OrderSkus[j];
					const price_sale = parseFloat(OrderSku.price_sale);
					if(isNaN(price_sale) || price_sale <= 0) return resolve({status: 400, message: "[server] 订单中的某个产品价格错误"});
					const quantity = OrderSku.quantity
					if(isNaN(quantity) || quantity <= 0) return resolve({status: 400, message: "[server] 订单中的某个产品数量错误"});
					data.order_items.push({
						desp: `${OrderProd.nome} ${OrderSku.attrs}`,
						price_sale,
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




















exports.payAfter =  async (req, res) => {
	console.log("/v1/payAfter");
	try {
		const payload = req.payload;
		const OrderId = req.body.OrderId;
		const Order = await OrderDB.findOne({_id: OrderId, Client: payload._id});

		Order.type_paid = ConfOrder.type_paid_obj.cash.num;
		Order.status = ConfOrder.status_obj.responding.num;
		const OrderSave = await Order.save();

		return res.json({status: 200, data: {OrderSave}});
	} catch (e) {
		console.log("payAfter error:   -------", e)
		return res.json({ error: e.message })
	}
}