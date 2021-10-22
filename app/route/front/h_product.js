const Prod = require('../../controllers/front/h_product/Prod');
const Sku = require('../../controllers/front/h_product/Sku');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {

	/* ================================== Prod ================================== */
	app.get('/api/v1/Prods', MdAuth.is_Client, Prod.vProds);
	app.get('/api/v1/Prod/:id', MdAuth.is_Client, Prod.vProd);

	/* ================================== Sku ================================== */
	app.get('/api/v1/Skus', MdAuth.is_Client, Sku.vSkus);
	app.get('/api/v1/Sku/:id', MdAuth.is_Client, Sku.vSku);
};