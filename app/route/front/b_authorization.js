const MdAuth = require('../../middle/middleAuth');
const ClientDB = require('../../models/auth/Client');

const Authorization = require('../../controllers/authorization.js')

module.exports = (app) => {
	/* 刷新 token */
	app.get('/api/v1/refreshtoken', (req, res) => {
		console.log('/v1/refreshtoken');
		Authorization.refreshtoken(req, res, ClientDB);
	});

	/* 登出 */
	app.delete('/api/v1/logout', (req, res) => {
		console.log('/v1/logout');
		Authorization.logout(req, res, ClientDB);
	});

	/* 登录 */
	app.post('/api/v1/login', (req, res) => {
		console.log('/v1/login');
		Authorization.login(req, res, ClientDB);
	});

	/* 用户注册 */
	app.post('/api/v1/register', (req, res) => {
		console.log('/v1/register');
		Authorization.register(req, res);
	});

	/* 关联第三方账号 */
	app.put('/api/v1/relSocial', MdAuth.path_Client, (req, res) => {
		console.log('/v1/relSocial');
		Authorization.relSocial(req, res);
	});

	/* 重新激活 换手机号或邮箱时用的 */
	app.put('/api/v1/reActive', MdAuth.path_Client, (req, res) => {
		console.log('/v1/reActive');
		Authorization.reActive(req, res);
	});

	/* 获取手机或邮箱验证码 */
	app.post('/api/v1/obtain_otp', (req, res) => {
		console.log('/v1/obtain_otp');
		Authorization.obtain_otp(req, res);
	});
};