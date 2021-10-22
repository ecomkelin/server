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
		const curUser = await UserDB.findOne({code: code, is_usable: true}, filter);

		if(!curUser) return res.status(200).json({status: 400, message: "[server] 用户名不正确"});

		const match_res = await MdFilter.bcrypt_match_Prom(pwd, curUser.pwd);
		if(match_res.status != 200) return res.status(200).json({status: 400, message: "[server] 密码不匹配"});

		const accessToken = MdJwt.generateAccessToken(curUser);
		const refreshToken = MdJwt.generateRefreshToken(curUser);

		curUser.at_last_login = Date.now();
		// 存入到数据库的refreshToken 加密
		curUser.refreshToken = await MdFilter.encrypt_tProm(refreshToken);
		const objSave = await curUser.save();

		return res.status(200).json({
			status: 200,
			message: "[server] 登录成功",
			data: {
				accessToken,
				refreshToken,
				curUser
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
		const refreshToken = MdJwt.obtain_token_from_headersToken(req.headers['authorization']);
		if(!refreshToken) return res.json({status: 400, message: "[server] 还没有被授权, 请登陆"});
		const refresh_res = await MdJwt.refreshToken_VerifyProm(refreshToken);
		if(refresh_res.status !== 200) return res.status(200).json({status: 200, message: refresh_res.message});
		const payload = refresh_res.payload;
		const curUser = await UserDB.findOne({_id: payload._id}, {refreshToken: 1});
		if(!curUser) return res.status(200).json({status: 200, message: "[server] 未找到相应用户"});
		curUser.refreshToken = null;
		const objSave = await curUser.save();

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
		const accessToken = MdJwt.obtain_token_from_headersToken(req.headers['authorization']);
		if(!accessToken) res.json({status: 400, message: "[server] 还没有被授权, 请刷新token"});
		const access_res = await MdJwt.accessToken_VerifyProm(accessToken);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curUser = access_res.payload;
		if(!ConfUser.role_Arrs.includes(curUser.role)) return res.json({status: 400, message: "[server] 权限参数错误"});
		
		return res.status(200).json({status: 200, message: "[server] 登陆状态", data: {curUser}});
	} catch(error) {
		console.log("/b1/isLogin", error);
		return res.status(500).json({status: 500, message: "[服务器错误: isLogin]"});
	}
}


// 用refreshToken刷新 accessToken
const refreshtokenFunc = async(req, res) => {
	console.log("/b1/refreshtoken");
	try {
		const reToken = MdJwt.obtain_token_from_headersToken(req.headers['authorization']);
		if(!reToken) return res.json({status: 400, message: "[server] 还没有被授权, 请登陆"});
		const refresh_res = await MdJwt.refreshToken_VerifyProm(reToken);
		if(refresh_res.status !== 200) return res.status(refresh_res.status).json(refresh_res);
		const payload = refresh_res.payload;
		const curUser = await UserDB.findOne({_id: payload._id});
		if(!curUser) return res.json({status: 400, message: "[server] 授权错误, 请重新登录"});
		const match_res = await MdFilter.bcrypt_match_Prom(reToken, curUser.refreshToken);
		if(match_res.status != 200) return res.status(200).json({status: 400, message: "[server] refreshToken 不匹配"});

		const accessToken = MdJwt.generateAccessToken(payload);
		const refreshToken = MdJwt.generateRefreshToken(curUser);
		
		curUser.at_last_login = Date.now();
		curUser.refreshToken = await MdFilter.encrypt_tProm(refreshToken);
		const objSave = await curUser.save();

		return res.status(200).json({
			status: 200,
			message: "[server] 刷新token成功",
			data: {accessToken, refreshToken, curUser: payload}
		});
	} catch(error) {
		console.log("/b1/refreshtoken", error);
		return res.status(500).json({status: 500, message: "[服务器错误: refreshtokenFunc]"});
	}
}