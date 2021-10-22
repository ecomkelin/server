const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintUser = require('../../../config/StintUser.js');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');

const UserDB = require('../../../models/auth/User');

const ShopDB = require('../../../models/auth/Shop');

const _ = require('underscore');



exports.UserPost = async(req, res) => {
	console.log("/b1/UserPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const obj = req.body.obj;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		// console.log(obj)
		let errorInfo = null;
		if(!obj.code) return res.json({status: 400, message: '[server] 请输入员工账户'});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintUser.code);
		if(!obj.pwd) return res.json({status: 400, message: '[server] 请输入密码'});
		obj.pwd = obj.pwd.replace(/(\s*$)/g, "").replace( /^\s*/, '');
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.pwd, StintUser.pwd);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		const objSame = await UserDB.findOne({code: obj.code});
		if(objSame) return res.json({status: 400, message: '[server] 用户编号相同'});

		if(!obj.role) return res.status(403).json({status: 400, message: "[server] 请选择用户权限"});
		if(payload.role >= obj.role) return res.status(403).json({status: 400, message: "[server] 您的权限不足"});
		if(!ConfUser.role_Arrs.includes(parseInt(obj.role))) return res.json({status: 400, message: '[server] 用户权限参数错误'});
		if(obj.role >= ConfUser.role_set.boss) {
			if(!obj.Shop) return res.json({status: 400, message: '[server] 请选择用户的所属分店'});
			if(!MdFilter.is_ObjectId_Func(obj.Shop)) return res.json({status: 400, message: '[server] 请输入用户所在分店'});
			const Shop = await ShopDB.findOne({_id: obj.Shop, Firm: payload.Firm});
			if(!Shop) return res.json({status: 400, message: '[server] 没有找到您选择的分店信息'});
		} else {
			obj.Shop = null;
		}
		if(payload.role >= ConfUser.role_set.boss) {
			obj.Shop = payload.Shop;
		}

		obj.pwd = await MdFilter.encrypt_tProm(obj.pwd);

		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;

		const _object = new UserDB(obj);
		const objSave = await _object.save();
		// console.log('UserPost end')
		return res.status(200).json({status: 200, message: "[server] 创建新成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/UserPost", error);
		return res.status(500).json({status: 500, message: "[服务器错误: UserPost]: "+ error});
	}
}

exports.UserPut = async(req, res) => {
	console.log("/b1/UserPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的User的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		User_path_Func(pathObj, payload);

		const User = await UserDB.findOne(pathObj);
		if(!User) return res.json({status: 400, message: "[server] 没有找到此用户信息, 请刷新重试"});

		if(req.body.general) {
			User_general(res, req.body.general, User, payload); 
		} else if(req.body.password) {
			User_putPwd(res, req.body.password, User, payload); 
		} else {
			return res.json({status: 400, message: "[server] 请传递正确的数据 对象数据"});
		}
		
	} catch(error) {
		console.log("/b1/UserPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: UserPut]"});
	}
}

const User_putPwd = async(res, obj, User, payload) => {
	try{
		if(!obj.pwd || !obj.pwdConfirm) return res.json({status: 400, message: '[server] 密码不能为空'});
		obj.pwd = obj.pwd.replace(/(\s*$)/g, "").replace( /^\s*/, '');
		obj.pwdConfirm = obj.pwdConfirm.replace(/(\s*$)/g, "").replace( /^\s*/, '');
		if(obj.pwd !== obj.pwdConfirm) return res.json({status: 400, message: '[server] 确认密码不一致'});
		let errorInfo = null;
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.pwd, StintUser.pwd);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		if(payload.role >= User.role) {
			if(!obj.pwdOrg) return res.json({status: 400, message: "[server] 请输入原密码, 如果忘记, 请联系管理员"});
			const pwdOrg = obj.pwdOrg.replace(/(\s*$)/g, "").replace( /^\s*/, '');
			const pwd_match_res = await MdFilter.bcrypt_match_Prom(pwdOrg, User.pwd);
			if(pwd_match_res.status != 200) return res.json({status: 400, message: "[server] 原密码错误，请重新操作"});
		}
		User.pwd = await MdFilter.encrypt_tProm(obj.pwd);
		const objSave = await User.save();
		return res.status(200).json({status: 200, data: {object: objSave}, message: '[server] 密码修改成功'});
	} catch(error) {
		console.log("/b1/User_putPwd", error);
		return res.status(500).json({status: 500, message: "[服务器错误: User_putPwd]"});
	}
}
const User_general = async(res, obj, User, payload) => {
	try{
		MdFilter.readonly_Func(obj);
		delete obj.at_last_login;
		delete obj.refreshToken;

		let errorInfo = null;

		if(obj.code && (obj.code != User.code)) {
			// 只有管理员以上可以更改
			if(payload.role >= ConfUser.role_set.manager) return res.json({status: 400, message: '[server] 修改用户编号需要总公司管理权限'});
			obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintUser.code);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
			const objSame = await UserDB.findOne({_id: {$ne: User._id}, code: obj.code})
			if(objSame) return res.json({status: 400, message: '[server] 此用户账户已被占用, 请查看'});
		}

		if(obj.role && (obj.role != User.role)) {
			obj.role = parseInt(obj.role);
			if(payload.role === User.role) return res.json({status: 400, message: '[server] 您不可以自己修改此信息'});
			// 只有管理员以上可以更改
			if(payload.role >= ConfUser.role_set.manager) return res.json({status: 400, message: '[server] 修改用户权限需要总公司管理权限'});
			if(!ConfUser.role_Arrs.includes(obj.role)) return res.json({status: 400, message: '[server] 您设置的用户权限参数不存在'});
			if(obj.role >= ConfUser.role_set.boss && !obj.Shop) return res.json({status: 400, message: '[server] 请为该角色设置分店'});
			if(obj.role < ConfUser.role_set.boss) obj.Shop = null;
		}

		const role = obj.role || User.role;
		if(role >= ConfUser.role_set.boss) {
			if(!MdFilter.is_ObjectId_Func(obj.Shop)) return res.json({status: 400, message: '[server] 分店数据需要为 _id 格式'});
			if(payload.role >= ConfUser.role_set.manager)	return res.json({status: 400, message: '[server] 修改用户所属店铺需要总公司管理权限'});
			const Shop = await ShopDB.findOne({_id: obj.Shop, Firm: payload.Firm});
			if(!Shop) return res.json({status: 400, message: '[server] 没有找到此分店信息'});
		} else {
			obj.Shop = null;
		}

		if(payload._id != User._id) obj.User_upd = payload._id;
		const _object = _.extend(User, obj);

		const objSave = await _object.save();
		return res.status(200).json({status: 200, data: {object: objSave}, message: '[server] 修改成功'});
	} catch(error) {
		console.log("/b1/User_general", error);
		return res.status(500).json({status: 500, message: "[服务器错误: User_general]"});
	}
}

exports.UserDelete = async(req, res) => {
	console.log("/b1/UserDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的User的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const pathObj = {_id: id};
		User_path_Func(pathObj, payload);

		const User = await UserDB.findOne(pathObj);
		if(!User) return res.json({status: 400, message: "[server] 没有找到此用户信息, 请刷新重试"});
		if(payload.role >= User.role) return res.status(403).json({status: 400, message: "[server] 您没有权限删除此用户"});

		const objDel = await UserDB.deleteOne({_id: User._id});
		return res.status(200).json({status: 200, message: '[server] 删除成功'})
	} catch(error) {
		console.log("/b1/UserDelete", error);
		return res.status(500).json({status: 500, message: "[服务器错误: UserDelete]"});
	}
}














const User_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	pathObj.role = {$gte: payload.role};
	if(payload.Shop) pathObj.Shop = payload.Shop;
	if(payload.role == ConfUser.role_set.staff || payload.role == ConfUser.role_set.worker) pathObj._id = payload._id;

	if(!queryObj) return;
}
const dbUser = 'User';

exports.Users = async(req, res) => {
	console.log("/b1/Users");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			Identity: payload,
			queryObj: req.query,
			objectDB: UserDB,
			path_Callback: User_path_Func,
			dbName: dbUser,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/Users", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Users]"});
	}
}

exports.User = async(req, res) => {
	console.log("/b1/User")
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: payload,
			queryObj: req.query,
			objectDB: UserDB,
			path_Callback: User_path_Func,
			dbName: dbUser,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/b1/User", error);
		return res.status(500).json({status: 500, message: "[服务器错误: User]"});
	}
}