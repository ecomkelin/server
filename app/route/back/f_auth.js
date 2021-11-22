const Lang = require('../../controllers/back/f_auth/Lang');
const Firm = require('../../controllers/back/f_auth/Firm');
const Shop = require('../../controllers/back/f_auth/Shop');
const User = require('../../controllers/back/f_auth/User');
const Bind = require('../../controllers/back/f_auth/Bind');
const Client = require('../../controllers/back/f_auth/Client');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {
	/* ------------------------ Lang ------------------------ */
	app.get('/api/b1/Langs', MdAuth.path_ower, Lang.Langs);
	app.post('/api/b1/Lang', MdAuth.path_ower, Lang.LangPost);
	app.put('/api/b1/Lang/:id', MdAuth.path_ower, Lang.LangPut);

	/* ------------------------ Firm ------------------------ */
	app.get('/api/b1/Firm/:id', MdAuth.path_User, Firm.Firm);
	app.put('/api/b1/Firm/:id', MdAuth.path_mger, Firm.FirmPut);

	/* ------------------------ Shop ------------------------ */
	app.delete('/api/b1/Shop/:id', MdAuth.path_mger, Shop.ShopDelete);
	app.get('/api/b1/Shop/:id', MdAuth.path_User, Shop.Shop);
	app.put('/api/b1/Shop/:id', MdAuth.path_mger, Shop.ShopPut);
	app.post('/api/b1/Shop', MdAuth.path_mger, Shop.ShopPost);
	app.get('/api/b1/Shops', MdAuth.path_User, Shop.Shops);

	/* ------------------------ User ------------------------ */
	app.delete('/api/b1/User/:id', MdAuth.by_bser, User.UserDelete);
	app.get('/api/b1/User/:id', MdAuth.path_User, User.User);
	app.put('/api/b1/User/:id', MdAuth.path_User, User.UserPut);
	app.post('/api/b1/User', MdAuth.by_bser, User.UserPost);
	app.get('/api/b1/Users', MdAuth.by_bser, User.Users);

	// /* ------------------------ Client ------------------------ */
	app.get('/api/b1/Client/:id', MdAuth.path_User, Client.Client);
	app.put('/api/b1/Client/:id', MdAuth.path_User, Client.ClientPut);
	app.get('/api/b1/Clients', MdAuth.path_User, Client.Clients);

	/* ------------------------ Bind ------------------------ */
	app.delete('/api/b1/Bind/:id', MdAuth.path_User, Bind.BindDelete);
	app.get('/api/b1/Bind/:id', MdAuth.path_User, Bind.Bind);
	app.put('/api/b1/Bind/:id', MdAuth.path_User, Bind.BindPut);
	app.get('/api/b1/Binds', MdAuth.path_User, Bind.Binds);
};
