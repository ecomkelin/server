const Pd = require('../../controllers/back/h_product/Pd');
const Prod = require('../../controllers/back/h_product/Prod');
const Prod_Attr = require('../../controllers/back/h_product/Prod_Attr');
const Sku = require('../../controllers/back/h_product/Sku');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {
	/* ================================== Pd ================================== */
	app.delete('/api/b1/Pd/:id', MdAuth.path_sfer, Pd.PdDelete);
	app.get('/api/b1/Pd/:id', MdAuth.path_User, Pd.Pd);
	app.put('/api/b1/Pd/:id', MdAuth.path_sfer, Pd.PdPut);
	app.post('/api/b1/Pd', MdAuth.path_sfer, Pd.PdPost);
	app.get('/api/b1/Pds', MdAuth.path_User, Pd.Pds);

	/* ================================== Prod ================================== */
	app.delete('/api/b1/Prod/:id', MdAuth.path_User, Prod.ProdDelete);
	app.get('/api/b1/Prod/:id', MdAuth.path_User, Prod.Prod);
	app.put('/api/b1/Prod/:id', MdAuth.path_User, Prod.ProdPut);
	app.post('/api/b1/Prod', MdAuth.path_User, Prod.ProdPost);
	app.get('/api/b1/Prods', MdAuth.path_User, Prod.Prods);

	/* ------------------------ Prod Attr ------------------------ */
	app.delete('/api/b1/Attr/:id', MdAuth.path_User, Prod_Attr.AttrDelete);
	app.put('/api/b1/Attr/:id', MdAuth.path_User, Prod_Attr.AttrPut);
	app.post('/api/b1/Attr', MdAuth.path_User, Prod_Attr.AttrPost);	

	/* ================================== Sku ================================== */
	app.delete('/api/b1/Sku/:id', MdAuth.path_User, Sku.SkuDelete);
	app.get('/api/b1/Sku/:id', MdAuth.path_User, Sku.Sku);
	app.put('/api/b1/Sku/:id', MdAuth.path_User, Sku.SkuPut);
	app.post('/api/b1/Sku', MdAuth.path_User, Sku.SkuPost);
	app.get('/api/b1/Skus', MdAuth.path_User, Sku.Skus);
};