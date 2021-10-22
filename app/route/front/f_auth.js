const Shop = require('../../controllers/front/f_auth/Shop');
const Client = require('../../controllers/front/f_auth/Client');
const Bind = require('../../controllers/front/f_auth/Bind');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {
	/* ------------------------------ Shop ------------------------------ */
	app.get('/api/v1/Shops', MdAuth.is_Client, Shop.vShops);
	app.get('/api/v1/Shop/:id', MdAuth.is_Client, Shop.vShop);

	/* ------------------------------ Client ------------------------------ */
	app.get('/api/v1/Client', MdAuth.path_Client, Client.vClient);
	app.put('/api/v1/Client', MdAuth.path_Client, Client.vClientPut);

	/* ------------------------------ Bind ------------------------------ */
	app.delete('/api/v1/Bind/:id', MdAuth.path_Client, Bind.vBindDelete);
	app.get('/api/v1/Bind/:id', MdAuth.path_Client, Bind.vBind);
	app.put('/api/v1/Bind/:id', MdAuth.path_Client, Bind.vBindPut);
	app.get('/api/v1/Binds', MdAuth.path_Client, Bind.vBinds);
};
