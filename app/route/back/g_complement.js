const Brand = require('../../controllers/back/g_complement/Brand');
const Categ = require('../../controllers/back/g_complement/Categ');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {

	/* ------------------------ Brand ------------------------ */
	app.delete('/api/b1/Brand/:id', MdAuth.path_sfer, Brand.BrandDelete);
	app.get('/api/b1/Brand/:id', MdAuth.path_User, Brand.Brand);
	app.put('/api/b1/Brand/:id', MdAuth.path_sfer, Brand.BrandPut);
	app.post('/api/b1/Brand', MdAuth.path_sfer, Brand.BrandPost);
	app.get('/api/b1/Brands', MdAuth.path_User, Brand.Brands);

	/* ------------------------ Categ ------------------------ */
	app.delete('/api/b1/Categ/:id', MdAuth.path_sfer, Categ.CategDelete);
	app.get('/api/b1/Categ/:id', MdAuth.path_User, Categ.Categ);
	app.put('/api/b1/Categ/:id', MdAuth.path_sfer, Categ.CategPut);
	app.post('/api/b1/Categ', MdAuth.path_sfer, Categ.CategPost);
	app.get('/api/b1/Categs', MdAuth.path_User, Categ.Categs);
};