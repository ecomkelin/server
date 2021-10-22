const Brand = require('../../controllers/front/g_complement/Brand');
const Categ = require('../../controllers/front/g_complement/Categ');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {
	/* ------------------------ Brand ------------------------ */
	app.get('/api/v1/Brands', MdAuth.is_Client, Brand.vBrands);
	app.get('/api/v1/Brand/:id', MdAuth.is_Client, Brand.vBrand);

	/* ------------------------ Categ ------------------------ */
	app.get('/api/v1/Categs', MdAuth.is_Client, Categ.vCategs);	
	app.get('/api/v1/Categ/:id', MdAuth.is_Client, Categ.vCateg);
};