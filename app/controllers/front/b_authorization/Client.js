const axios = require('axios');

const StintClient = require('../../../config/StintClient.js');
const ConfIndex = require('../../../config/ConfIndex');
const MdFilter = require('../../../middle/middleFilter');
const MdJwt = require('../../../middle/middleJwt');

const ClientDB = require('../../../models/auth/Client');

/* 用户登出 */
exports.logout = async(req, res) => {
	console.log("/v1/logout");
	try {
		const refresh_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(refresh_res.status !== 200) return res.status(refresh_res.status).json(refresh_res);
		const payload = refresh_res.data.payload;
		const Client = await ClientDB.findOne({_id: payload._id}, {refreshToken: 1});
		if(!Client) return res.status(200).json({status: 200, message: "[server] 未找到相应用户"});
		// if(Client.refreshToken !== refreshToken) return res.json({status: 400, message: "[server] 服务器未删除"});
		Client.refreshToken = null;
		const objSave = await Client.save();
		return res.status(200).json({status: 200, message: "[server] 成功从服务器登出"});
	} catch(error) {
		console.log("/v1/logout", error);
		return res.status(500).json({status: 500, message: "[服务器错误: logout]"});
	}
}

/* 判断是否登陆 */
exports.isLogin = async(req, res) => {
	console.log("/v1/isLogin");
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curClient = access_res.data.payload;
		
		return res.status(200).json({status: 200, message: "[server] 登陆状态", data: {curClient}});
	} catch(error) {
		console.log("/v1/isLogin", error);
		return res.status(500).json({status: 500, message: "[服务器错误: isLogin]"});
	}
}


/* 用refreshToken刷新 accessToken */
exports.refreshtoken = async(req, res) => {
	console.log("/v1/refreshtoken");
	try {
		const refresh_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(refresh_res.status !== 200) return res.status(refresh_res.status).json(refresh_res);

		const payload = refresh_res.data.payload;
		const accessToken = MdJwt.generateToken(payload);
		return res.status(200).json({
			status: 200,
			message: "[server] 刷新token成功",
			data: {accessToken, curClient: payload},
		});
	} catch(error) {
		console.log("/v1/refreshtoken", error);
		return res.status(500).json({status: 500, message: "[服务器错误: refreshtoken]"});
	}
}










/* 关联第三方登录 */
exports.vRelSocial = async(req, res)=> {
	console.log("/v1/vRelSocial");
	try{
		const curClient = req.curClient;
		const Client = await ClientDB.findOne({_id: curClient._id});

		// 从前端获取 登录类型 及第三方社交账号的 token
		const login_type = req.body.login_type;
		const Client_accessToken = req.body.Client_accessToken;

		// 判断是否已经关联了此类型的社交账号
		const is_reled = Client.socials.map(item => {if(item.social_type === login_type) return item});
		if(is_reled.length > 0) return res.json({status: 400, message: "[server] 已经存在此社交媒体"});

		// 根据 登录类型 和 第三方token 获取第三方社交账号的登录结果
		let social_res = null;
		if(login_type === "facebook") {
			// console.log("/v1/vRelSocial", "facebook");
			social_res = await facebookAuth_Prom(Client_accessToken);
		} else if(login_type === "google") {
			// console.log("/v1/vRelSocial", "google");
			social_res = await googleAuth_Prom(Client_accessToken);
		} else {
			return res.json({status: 400, message: "[server] 系统还没有此社交媒体关联"});
		}
		if(social_res.status !== 200) return res.json(social_res);
		// 获取第三方的 唯一标识 user_id
		const user_id = social_res.data.user_id;
		if(!user_id) return res.json({status: 400, message: "[server] 没有找到 user_id 请联系后端"});

		// 查找其他账号 是否被此账号 关联 如果已被关联 则不可再次关联
		let ClientSame = await ClientDB.findOne({socials: { $elemMatch: {social_type: login_type, social_id: user_id}} });
		if(ClientSame) return res.json({status: 400, message: "[server] 此第三方社交媒体已关联了账户"});

		// 在此账号上加入 第三方社交账号
		Client.socials.push({social_type: login_type, social_id: user_id});

		const objSave = await Client.save();
		if(!objSave) return status(400).json({status: 400, message: "[server] 保存错误"});

		return res.status(200).json({status: 200, message: "[server] 成功"});

	} catch(error) {
		console.log("/v1/vRelSocial", error);
		return res.status(500).json({status: 500, message: "[服务器错误: login]"});
	}
}




/*
	用户登录
	获取用户信息
	生成本地 accessToken 和 refreshToken
	并记录用户的登录时间 保存到数据库
*/
exports.login = async(req, res) => {
	console.log("/v1/login")
	try{
		const result_Exist = await obtain_Client_Prom(req.body.system, req.body.social);
		if(result_Exist.status === 400) return res.json({status: 400, message: result_Exist.message});
		let curClient = result_Exist.data.Client;

		if(!curClient) return res.json({status: 400, message: "[server] 登陆失败"});
		const accessToken = MdJwt.generateToken(curClient);
		const refreshToken = MdJwt.generateToken(curClient, true);

		curClient.at_last_login = Date.now();
		curClient.refreshToken = refreshToken;
		const objSave = await curClient.save();

		return res.status(200).json({
			status: 200,
			message: "[server] 登录成功",
			data: {
				accessToken,
				refreshToken,
				curClient
			},
		})
	} catch(error) {
		console.log("/v1/login", error);
		return res.status(500).json({status: 500, message: "[服务器错误: login]"});
	}
}
// 获取用户信息
// 1 账号(code,email,phone)密码登录
// 2 第三方登录
const obtain_Client_Prom = (system_obj, social_obj) => {
	return new Promise(async(resolve) => {
		try{
			if(system_obj) {
				const phonePre = MdFilter.get_phonePre_Func(system_obj.phonePre);
				let Client = await ClientDB.findOne({
					$or: [
						{code: system_obj.code},
						{email: system_obj.email},
						{phone: phonePre+system_obj.phone},
					],
				});
				if(!Client) return resolve({status: 400, message: "没有找到此账号"});
				const pwd_match_res = await MdFilter.bcrypt_match_Prom(system_obj.pwd, Client.pwd);
				if(pwd_match_res.status != 200) return resolve({status: 400, message: "[server] 密码不匹配"});
				return resolve({status: 200, data: {Client}});
			} else if(social_obj) {
				// 从前端获取 登录类型 及第三方社交账号的 token
				const login_type = social_obj.login_type;
				const Client_accessToken = social_obj.Client_accessToken;

				// 根据 登录类型 和 第三方token 获取第三方社交账号的登录结果
				let social_res = null;
				if(login_type === "facebook") {
					// console.log("obtain_Client_Prom", "facebook");
					social_res = await facebookAuth_Prom(Client_accessToken);
				} else if(login_type === "google") {
					// console.log("obtain_Client_Prom", "google");
					social_res = await googleAuth_Prom(Client_accessToken);
				}
				if(social_res.status !== 200) return resolve({status: social_res.status, message: social_res.message});
				// 获取第三方的 唯一标识 user_id
				const user_id = social_res.data.user_id;
				if(!user_id) return resolve({status: 400, message: "[server] 没有找到 user_id 请联系后端"});

				// 查看是否已登录过系统
				// 如果已经登录 则找到此系统账号
				let Client = await ClientDB.findOne({socials: { $elemMatch: {social_type: login_type, social_id: user_id}} });

				// 如果此第三方账号 不在系统中 则为其创建一个 系统账号
				if(!Client) {
					// 生成新 code
					const result_code = await generate_codeClient_Prom();
					if(result_code.status !== 200) return resolve({status: 400, message: result_code.message});
					const obj = {};
					obj.socials = [
						{
							social_type: login_type,
							social_id: user_id
						}
					];
					obj.code = result_code.data.code;
					obj.is_usable = true;
					const _object = new ClientDB(obj);
					Client = await _object.save();
					if(!Client) return resolve({status: 400, message: "[server] 第三方登陆 创建用户失败"});
				}
				return resolve({status: 200, data: {Client}});
			}
			resolve({status: 400, message: "[server] 请传入正确的登陆参数"});
		} catch(error) {
			console.log("obtain_Client_Prom", error);
			resolve({status: 400, message: "[server] Error"});
		}
	})
}
const googleAuth_Prom = async(Client_accessToken) => {
	return new Promise(async(resolve) => {
		try {
			const CLIENT_ID = process.env.GOOGLE_APPID;
			const token = Client_accessToken;
			const {OAuth2Client} = require('google-auth-library');
			const client = new OAuth2Client(CLIENT_ID);
			// console.log("googleAuth_Prom", Client_accessToken)
			const ticket = await client.verifyIdToken({
				idToken: token,
				audience: CLIENT_ID,
			});
			const payload = ticket.getPayload();
			return resolve({status: 200, data: {object: payload, user_id: payload['sub']}})
		} catch(error) {
			console.log("googleAuth_Prom", error);
			return resolve({status: 500, message: `[server googleAuth_Prom] Error: ${error}`});
		}
	})
}
const facebookAuth_Prom = async(Client_accessToken) => {
	console.log("/v1/facebookAuth_Prom");
	return new Promise(async(resolve) => {
		try {
			if(!Client_accessToken) return resolve({status: 400, message: "[server facebookAuth_Prom] 请传入 客户facebook 对应的 accessToken"});
			const url = `https://graph.facebook.com/debug_token?access_token=${process.env.FB_APPID}%7C${process.env.FB_APPSECRET}&input_token=${Client_accessToken}`;
			const response = await axios.get(url);

			return resolve({status:200, data: {object: response.data.data, user_id: response.data.data.user_id}});
		} catch(error) {
			console.log("/v1/facebookAuth_Prom", error);
			return resolve({status: 500, message: `[server facebookAuth_Prom] Error: ${error}`});
		}
	})
}





/* 获取手机验证码 */
exports.vObtain_otp = async(req, res) => {
	console.log("/v1/Obtain_otp");
	let [to, channel] = [null, null];

	if(req.body.email) {
		channel = 'email';
		to = req.body.email;
	} else if(req.body.phonePre && req.body.phone){
		channel = 'sms';
		const phonePre = MdFilter.get_phonePre_Func(req.body.phonePre);
		if(!phonePre) return res.json({status: 400, message: "[server] phonePre 错误"});
		const phone =req.body.phone;
		to = `${phonePre}${phone}`;
	} else {
		return res.json({status: 400, message: `[server] 请输入正确的邮箱或电话参数`})
	}
	const accountSid = process.env.TWILIO_ACCOUNT_SID;
	const authToken = process.env.TWILIO_AUTH_TOKEN;
	const client = require('twilio')(accountSid, authToken);

	client.verify
	.services(process.env.TWILIO_SERVICE_SID)
	.verifications
	.create({to, channel})
	.then(verification => {
		// console.log("/v1/Obtain_otp", verification.status);
		// 要给一个过期时间
		return res.json({status: 200, data: {status: verification.status}});
	}).catch(error => {
		console.log("/v1/Obtain_otp", error)
		return res.json({status: 500, message: `Error: ${error}`})
	});
}
// 检查 验证码 是否正确
const verifyChecks_Prom = async(to, code) => {
	return new Promise((resolve) => {
		const accountSid = process.env.TWILIO_ACCOUNT_SID;
		const authToken = process.env.TWILIO_AUTH_TOKEN;
		const client = require('twilio')(accountSid, authToken);

		client.verify.services(process.env.TWILIO_SERVICE_SID)
		.verificationChecks
		.create({to, code})
		.then(async(verification_check) => {
			resolve({status: 200, data: {status: verification_check.status}});
		}).catch(error => {
			console.log("verifyChecks_Prom", error);
			resolve({status: 500, message: `Error: ${error}`});
		});
	})
}

/* 新账户注册 */
exports.vRegister = async(req, res) => {
	console.log("/v1/register");
	try {
		let obj = null;
		let to = null;
		// const {email, phone, phonePre, pwd, opt} = req.body;
		const pathSame = {};	// 检查是否有相同的账号
		if(req.body.email) {		// 邮箱注册
			to = req.body.email;
			obj = {email: to};
			pathSame.email = to;
		} else {					// 手机注册
			const phonePre = MdFilter.get_phonePre_Func(req.body.phonePre);
			if(!phonePre) return res.json({status: 400, message: "[server] phonePre 错误"});
			const phone = req.body.phone;
			to = phonePre+phone;
			obj = {phone: to};
			pathSame.phone = to;
		}
		const vrifyChecks_res = await verifyChecks_Prom(to, req.body.otp);	// 把注册邮箱或手机 连同验证码 验证
		if(vrifyChecks_res.status !== 200) return res.json({status: 400, message: "[server] 验证不成功"});

		// 如果验证成功 则检查数据库 是否已有此邮箱或手机的账户
		const objSame = await ClientDB.findOne(pathSame);	
		if(objSame) return res.json({status: 400, message: "[server] 此电话或邮箱已被注册"});
		// 创建新账户
		const code_result = await generate_codeClient_Prom();		// 自动生成账户编号
		if(code_result.status !== 200) return res.json({status: 400, message: code_result.message});
		obj.code = code_result.data.code;

		const pwd = req.body.pwd.replace(/(\s*$)/g, "").replace( /^\s*/, '');
		const errorInfo = MdFilter.Stint_Match_Func(pwd, StintClient.pwd);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.pwd = await MdFilter.encrypt_tProm(pwd);			// 密码加密

		obj.is_active = true;
		obj.is_usable = true;
		const _object = new ClientDB(obj);
		objSave = await _object.save();
		if(!objSave) return res.json({status: 400, message: "[server] 创建用户失败"});
		return res.status(200).json({status: 200, data: {object: objSave}});
	} catch(error) {
		console.log("/v1/register", error);
		return res.status(500).json({status: 500, message: "[服务器错误: register]"});
	}
}



/* 重新激活 换手机号或邮箱时用的 */
exports.vReActive = async(req, res) => {
	console.log("/v1/reActive")
	try{
		const curClient = req.curClient;
		const Client = await ClientDB.findOne({_id: curClient._id});
		if(!Client) return res.json({status: 400, message: "[server] 没有找到此人"});
		const pwd_match_res = await MdFilter.bcrypt_match_Prom(req.body.pwd, Client.pwd);
		if(pwd_match_res.status != 200) return resolve({status: 400, message: "[server] 密码不匹配"});

		let obj = null;
		let to = null;
		const pathSame = {_id: {"$ne": curClient._id}};
		if(req.body.email) {		// 邮箱注册
			to = req.body.email;
			obj = {email: to};
			pathSame.email = to;
			Client.email = to;
		} else {					// 手机注册
			const phonePre = MdFilter.get_phonePre_Func(req.body.phonePre);
			if(!phonePre) return res.json({status: 400, message: "[server] phonePre 错误"});
			const phone = req.body.phone;
			to = phonePre+phone;
			obj = {phone: to};
			pathSame.phone = to;
			Client.phone = to;
		}
		const vrifyChecks_res = await verifyChecks_Prom(to, req.body.otp);	// 把注册邮箱或手机 连同验证码 验证
		if(vrifyChecks_res.status !== 200) return res.json({status: 400, message: "[server] 验证不成功"});

		// 如果验证成功 则检查数据库 是否已有其他此邮箱或手机的账户
		const objSame = await ClientDB.findOne(pathSame);	
		if(objSame) return res.json({status: 400, message: "[server] 此电话或邮箱已被注册"});
		
		objSave = await Client.save();
		if(!objSave) return res.json({status: 400, message: "[server] 重新激活失败"});

		return res.status(200).json({status: 200, data: {object: objSave}});
	} catch(error) {
		console.log("/v1/reActive", error)
		return res.status(500).json({status: 500, message: "[服务器错误: Client]"});
	}
}



// 生成账户编号
const generate_codeClient_Prom = () => {
	console.log('generate_codeClient_Prom')
	return new Promise(async(resolve) => {
		try{
			// 找到未更改账号的 最新注册账号
			const pre_Client = await ClientDB.findOne({is_changed: false})
				.sort({'at_crt': -1});
			// 获取今天的日期
			const nowDate = new Date();
			const year = nowDate.getFullYear();	// 2021
			const month = nowDate.getMonth()+1;	// 7
			const Mth = ConfIndex.month[month];	// JUL

			let codeNum = 1;	// 如果之前没有注册用户 则编号为 1
			if(pre_Client) {	// 如果有用户 则获取之前用户的编号 并且 +1
				const poMonth = ConfIndex.month[pre_Client.at_crt.getMonth()+1];
				if((Mth === poMonth) && (year === pre_Client.at_crt.getFullYear()) ) {
					codeNum = parseInt(pre_Client.code.split(poMonth)[1])+1;
				}
			}
			const codePre = String(year%100) + Mth;	// 编号的前缀
			// 根据编号前缀 和 预计编号 获取完整的 用户编号， 为了防止账户重复 所以要先验证
			const code_res = await recu_codeClientSame_Prom(codePre, codeNum);
			return resolve(code_res);
		} catch(error) {
			console.log("generate_codeClient_Prom", error);
			resolve({status: 400, message: "[server generate_codeClient_Prom] Error"});
		}
	})
}
const recu_codeClientSame_Prom = (codePre, codeNum) => {
	return new Promise(async(resolve) => {
		try{
			codeNum = String(codeNum);
			for(let len = codeNum.length; len < 4; len = codeNum.length) codeNum = "0" + codeNum; // 序列号补0
			// 验证是否有此账号
			const objSame = await ClientDB.findOne({code: codePre+codeNum});
			if(objSame) {// 如果有 则继续验证
				codeNum = parseInt(codeNum) + 1;
				const recu_res = await recu_codeClientSame_Prom(codePre, codeNum);
				return resolve({recu_res});
			} else {// 如果没有 则使用账号
				return resolve({status: 200, data: {code: codePre+codeNum}});
			}
		} catch(error) {
			console.log("recu_codeClientSame_Prom", error);
			return resolve({status: 400, message: "[server recu_codeClientSame_Prom] Error"});
		}
	})
}
