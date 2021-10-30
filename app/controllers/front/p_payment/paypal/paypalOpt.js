// 1. Set up your server to make calls to PayPal

// 1a. Import the SDK package
const paypal = require('@paypal/checkout-server-sdk');
const payPalClient = require('./payPalClient');

exports.transact11ion = async(order_items, payRes_url) => {
	console.log("transaction");
	return new Promise(async(resolve) => {
		try {
			const {return_url, cancel_url} = payRes_url;
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

			const request = new paypal.orders.OrdersCreateRequest();
			request.prefer("return=representation")
			request.requestBody({
				intent: "CAPTURE",
				purchase_units,
				application_context: {
					return_url,
					cancel_url,
				},
			});

			const order = await payPalClient.client().execute(request);
			if(!order) return resolve({status: 400, message: "paypalClient.execute Error"})
			resolve({ status: 200,
				data: {
					id: order.result.id
				}
			});
		} catch(error) {
			console.log("paypal transaction Error", error);
			return resolve({status: 500, message: "paypal transaction Error"});
		}
	})
}