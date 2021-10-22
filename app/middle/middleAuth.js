const ConfUser = require('../config/ConfUser.js');
const MdJwt = require('./middleJwt.js');

exports.is_Client = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 200) req.curClient = access_res.data.payload;
		return next();
	} catch(error) {
		console.log("is_Client", error);
		return res.status(200).json({status: 401, message: "is_Client Error: "+error});
	}
}

exports.path_Client = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		req.curClient = access_res.data.payload;
		return next();
	} catch(error) {
		console.log("path_Client", error);
		return res.status(200).json({status: 401, message: "Error: "+error});
	}
}

exports.is_User = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 200) req.curUser = access_res.data.payload;

		return next();
	} catch(error) {
		console.log("is_User", error);
		return res.status(200).json({status: 401, message: "is_User Error: "+error});
	}
}

exports.path_User = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		req.curUser = access_res.data.payload;
		return next();
	} catch(error) {
		// console.log("path_User", error);
		return res.status(200).json({status: 401, message: "Error: "+error});
	}
}

exports.path_ower = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curUser = access_res.data.payload;
		if(curUser.role != ConfUser.role_set.owner) return res.status(200).json({status: 401, message: '您需要此公司董事会权限'});
		req.curUser = curUser;
		return next();
	} catch(error) {
		console.log("path_ower", error);
		return res.status(200).json({status: 401, message: "Error: "+error});
	}
}

exports.path_mger = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curUser = access_res.data.payload;
		if(curUser.role > ConfUser.role_set.manager) return res.status(200).json({status: 401, message: '您需要此公司管理员以上权限'});
		req.curUser = curUser;
		return next();
	} catch(error) {
		console.log("path_mger", error);
		return res.status(200).json({status: 401, message: "您没有此权限"});
	}
}


exports.path_sfer = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curUser = access_res.data.payload;
		if(curUser.role > ConfUser.role_set.staff) return res.status(200).json({status: 401, message: '您需要此公司员工以上权限'});
		req.curUser = curUser;
		return next();
	} catch(error) {
		console.log("path_sfer", error);
		return res.status(200).json({status: 401, message: "您没有权限"});
	}
}

exports.path_bser = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curUser = access_res.data.payload;
		if(curUser.role > ConfUser.role_set.boss) return res.status(200).json({status: 401, message: '您需要此公司分店老板权限'});
		req.curUser = curUser;
		return next();
	} catch(error) {
		console.log("path_bser", error);
		return res.status(200).json({status: 401, message: "您没有权限"});
	}
}

// 总公司和分店的管理者权限
exports.by_bser = async(req, res, next) => {
	try {
		const access_res = await MdJwt.token_VerifyProm(req.headers['authorization']);
		if(access_res.status === 401) return res.status(200).json(access_res);
		const curUser = access_res.data.payload;

		if(curUser.role > ConfUser.role_set.manager && curUser.role != ConfUser.role_set.boss)
			return res.status(200).json({status: 401, message: '您没有此公司管理权限'});

		req.curUser = curUser;
		return next();
	} catch(error) {
		console.log("by_bser", error);
		return res.status(200).json({status: 401, message: "您没有此权限"});
	}
}