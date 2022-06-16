const OrderSku = require('../../controllers/back/i_order/OrderSku');
const OrderProd = require('../../controllers/back/i_order/OrderProd');

const Order = require('../../controllers/back/i_order/Order');
const Order_status = require('../../controllers/back/i_order/Order_status');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {
	/* ============================== OrderProd ============================== */
	app.get('/api/b1/OrderProds', MdAuth.path_User, OrderProd.OrderProds);

	/* ============================== OrderSku ============================== */
	app.delete('/api/b1/OrderSku/:id', MdAuth.path_User, OrderSku.OrderSkuDelete);
	app.put('/api/b1/OrderSku/:id', MdAuth.path_User, OrderSku.OrderSkuPut);
	app.post('/api/b1/OrderSku', MdAuth.path_User, OrderSku.OrderSkuPost);
	app.get('/api/b1/OrderSkus', MdAuth.path_User, OrderSku.OrderSkus);

	/* =============================== Order =============================== */
	app.delete('/api/b1/Order/:id', MdAuth.path_mger, Order.OrderDelete);
	app.put('/api/b1/Order/:id', MdAuth.path_User, Order.OrderPut);
	app.get('/api/b1/Orders', MdAuth.path_User, Order.Orders);
	app.get('/api/b1/Order/:id', MdAuth.path_User, Order.Order);
	/* ------------------- Order_status ------------------- */
	app.put('/api/b1/Order_change_status/:id', MdAuth.path_User, Order_status.Order_change_status);
};