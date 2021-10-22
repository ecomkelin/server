const Client = require('../../controllers/front/b_authorization/Client.js');

const MdAuth = require('../../middle/middleAuth');

module.exports = (app) => {
	app.post('/api/v1/login', Client.login);				// 登录
	app.post('/api/v1/obtain_otp', Client.vObtain_otp); 					// 获取手机或邮箱验证码
	app.post('/api/v1/register', Client.vRegister);							// 用户注册

	app.delete('/api/v1/logout', Client.logout);			// 登出
	app.get('/api/v1/refreshtoken', Client.refreshtoken);	// 刷新 token

	app.get('/api/v1/isLogin', Client.isLogin);				// 判断是否登录 
	app.put('/api/v1/reActive', MdAuth.path_Client, Client.vReActive);		// 重新激活 换手机号或邮箱时用的
	app.put('/api/v1/relSocial', MdAuth.path_Client, Client.vRelSocial);	// 关联第三方账号
};