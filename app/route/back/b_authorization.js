const MdJwt = require('../../middle/middleJwt');
const MdFilter = require('../../middle/middleFilter');

const UserDB = require('../../models/auth/User');

const Authorization = require('../../controllers/authorization.js')

module.exports = (app) => {
	/* ============= 用户登录 ============= */
	app.get('/api/b1/refreshtoken', (req, res) => {
		console.log('/b1/refreshtoken');
		Authorization.refreshtoken(req, res, UserDB);
	});

	app.delete('/api/b1/logout', (req, res) => {
		console.log('/b1/logout');
		Authorization.logout(req, res, UserDB);
	});

	app.post('/api/b1/login', (req, res) => {
		console.log('/b1/login');
		Authorization.login(req, res, UserDB);
	});
};