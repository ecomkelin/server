const ConfUser = require('../../config/ConfUser')
const UserDB = require('../../models/auth/User');
const MdJwt = require('../../middle/middleJwt');
const MdFilter = require('../../middle/middleFilter');
const MdSafe = require('../../middle/middleSafe');

module.exports = (app) => {
	/* ============= 用户登录 ============= */
	app.post('/api/b1/login', loginFunc);
	app.delete('/api/b1/logout', logoutFunc)

	/* ========== 判断用户是否为登陆状态 ========== */
	app.get('/api/b1/isLogin', isLoginFunc);

	app.get('/api/b1/refreshtoken', refreshtokenFunc)
};

// 用户登录
const loginFunc = async(req, res) => {
	console.log("/b1/login")
	try{
		// const populate = JSON.parse(req.query.populate);
		const code = req.body.code.replace(/^\s*/g,"").toUpperCase();
		const pwd = String(req.body.pwd).replace(/^\s*/g,"");
		if(!pwd || pwd.length == 0) return res.status(200).json({status: 400, message: "[server] 请您输入密码"});
		const filter = {phonePre: 1, phone: 1, code: 1, pwd: 1, role: 1, nome: 1, Firm: 1, Shop: 1};
		const payload = await UserDB.findOne({code: code, is_usable: true}, filter);

		if(!payload) return res.status(200).json({status: 400, message: "[server] 用户名不正确"});

		const match_res = await MdFilter.bcrypt_match_Prom(pwd, payload.pwd);
		if(match_res.status != 200) return res.status(200).json({status: 400, message: "[server] 密码不匹配"});

		const accessToken = MdJwt.generateToken(payload);
		const refreshToken = MdJwt.generateToken(payload, true);

		payload.at_last_login = Date.now();
		// 存入到数据库的refreshToken 加密
		payload.refreshToken = await MdFilter.encrypt_tProm(refreshToken);
		const objSave = await payload.save();

		return res.status(200).json({
			status: 200,
			message: "[server] 登录成功",
			data: {
				accessToken,
				refreshToken,
				payload
			},
		})
	} catch(error) {
		console.log("/b1/login", error);
		return res.status(500).json({status: 500, message: "[服务器错误: loginFunc]"});
	}
}

// 用户登出
const logoutFunc = async(req, res) => {
	console.log("/b1/logout");
	try {
		const refresh_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(refresh_res.status !== 200) return res.status(200).json({status: 200, message: refresh_res.message});
		const payload = refresh_res.data.payload;
		const User = await UserDB.findOne({_id: payload._id}, {refreshToken: 1});
		if(!User) return res.status(200).json({status: 200, message: "[server] 未找到相应用户"});
		User.refreshToken = null;
		const objSave = await User.save();

		return res.status(200).json({status: 200, message: "[server] 成功从服务器登出"});
	} catch(error) {
		console.log("/b1/logout", error);
		return res.status(500).json({status: 500, message: "[服务器错误: logoutFunc]"});
	}
}

// 判断是否登陆
const isLoginFunc = async(req, res) => {
	console.log("/b1/isLogin");
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const payload = access_res.data.payload;
		if(!ConfUser.role_Arrs.includes(payload.role)) return res.json({status: 400, message: "[server] 权限参数错误"});
		
		return res.status(200).json({status: 200, message: "[server] 登陆状态", data: {payload}});
	} catch(error) {
		console.log("/b1/isLogin", error);
		return res.status(500).json({status: 500, message: "[服务器错误: isLogin]"});
	}
}


// 用refreshToken刷新 accessToken
const refreshtokenFunc = async(req, res) => {
	console.log("/b1/refreshtoken");
	try {
		const refresh_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(refresh_res.status !== 200) return res.status(refresh_res.status).json(refresh_res);
		const payload = refresh_res.data.payload;
		const reToken = refresh_res.data.token;
		const User = await UserDB.findOne({_id: payload._id});
		if(!User) return res.json({status: 400, message: "[server] 授权错误, 请重新登录"});
		const match_res = await MdFilter.bcrypt_match_Prom(reToken, User.refreshToken);
		if(match_res.status != 200) return res.status(200).json({status: 400, message: "[server] refreshToken 不匹配"});

		const accessToken = MdJwt.generateToken(payload);
		const refreshToken = MdJwt.generateToken(User, true);
		
		User.at_last_login = Date.now();
		User.refreshToken = await MdFilter.encrypt_tProm(refreshToken);
		const objSave = await User.save();

		return res.status(200).json({
			status: 200,
			message: "[server] 刷新token成功",
			data: {accessToken, refreshToken, payload}
		});
	} catch(error) {
		console.log("/b1/refreshtoken", error);
		return res.status(500).json({status: 500, message: "[服务器错误: refreshtokenFunc]"});
	}
}