const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintUser = require('../../../config/StintUser.js');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');

const dbUser = 'User';
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
		// console.log(obj);

		const same_param = {$or: []};
		const stints = ['code', 'pwd'];
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		same_param["$or"].push({code: obj.code});

		obj.pwd = obj.pwd.replace(/^\s*/g,"");
		if(obj.phonePre && obj.phoneNum) {
			obj.phonePre = obj.phonePre.replace(/^\s*/g,"");
			obj.phoneNum = obj.phoneNum.replace(/^\s*/g,"");

			obj.phonePre = MdFilter.get_phonePre_Func(obj.phonePre);
			if(!obj.phonePre) return res.json({status: 400, message: "[server] phonePre 错误"});
			obj.phone = obj.phonePre+obj.phoneNum;
			same_param["$or"].push({phone: obj.phone});

			stints.push('phonePre');
			stints.push('phoneNum');
		}
		if(obj.email) {
			obj.email = obj.email.replace(/^\s*/g,"").toUpperCase();
			same_param["$or"].push({email: obj.email});
		}
		const errorInfo = MdFilter.Stint_Match_objs(StintUser, obj, stints);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		const objSame = await UserDB.findOne(same_param);
		if(objSame) {
			if(objSame.code === obj.code) return res.json({status: 400, message: '[server] 已有此用户编号'});
			if(objSame.phone === obj.phone) return res.json({status: 400, message: '[server] 已有此用户电话'});
			if(objSame.email === obj.email) return res.json({status: 400, message: '[server] 已有此用户邮箱'});
		}

		if(payload.role === ConfUser.role_set.boss) {
			obj.Shop = payload.Shop;
			obj.role = ConfUser.role_set.worker;
		}
		if(!obj.role) return res.json({status: 400, message: "[server] 请选择用户权限"});
		if(payload.role >= obj.role) return res.json({status: 400, message: "[server] 您的权限不足"});
		if(!ConfUser.role_Arrs.includes(parseInt(obj.role))) return res.json({status: 400, message: '[server] 用户权限参数错误'});
		if(obj.role >= ConfUser.role_set.boss) {
			if(!obj.Shop) return res.json({status: 400, message: '[server] 请选择用户的所属分店'});
			if(!MdFilter.is_ObjectId_Func(obj.Shop)) return res.json({status: 400, message: '[server] 请输入用户所在分店'});
			const Shop = await ShopDB.findOne({_id: obj.Shop, Firm: payload.Firm});
			if(!Shop) return res.json({status: 400, message: '[server] 没有找到您选择的分店信息'});
		} else {
			obj.Shop = null;
		}

		obj.pwd = await MdFilter.encrypt_tProm(obj.pwd);

		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;

		const _object = new UserDB(obj);
		const objSave = await _object.save();
		if(Object.keys(req.query).length > 0) {
			const db_res = await GetDB.db(obtFilterObj(req, objSave._id));
			return res.json(db_res);
		} else {
			return res.json({status: 200, data: {object: objSave}, message: '[server] 创建新成功'});
		}
	} catch(error) {
		console.log("/b1/UserPost", error);
		return res.json({status: 500, message: "[服务器错误: UserPost]: "+ error});
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

		if(payload.role >= User.role && payload._id != User._id) return res.json({status: 400, message: "[server] 您没有权限修改 此用户信息"});

		if(req.body.general) {
			User_general(req, res, User, payload); 
		} else if(req.body.password) {
			User_putPwd(req, res, User, payload); 
		} else {
			return res.json({status: 400, message: "[server] 请传递正确的数据 对象数据"});
		}

	} catch(error) {
		console.log("/b1/UserPut", error);
		return res.json({status: 500, message: "[服务器错误: UserPut]"});
	}
}

const User_putPwd = async(req, res, User, payload) => {
	try{
		const obj = req.body.password;
		if(!obj.pwd || !obj.pwdConfirm) return res.json({status: 400, message: '[server] 密码不能为空'});
		obj.pwd = obj.pwd.replace(/(\s*$)/g, "").replace( /^\s*/, '');
		obj.pwdConfirm = obj.pwdConfirm.replace(/(\s*$)/g, "").replace( /^\s*/, '');
		if(obj.pwd !== obj.pwdConfirm) return res.json({status: 400, message: '[server] 确认密码不一致'});
		const errorInfo = MdFilter.Stint_Match_objs(StintUser, obj, ['pwd']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		if(payload.role >= User.role) {
			if(!obj.pwdOrg) return res.json({status: 400, message: "[server] 请输入原密码, 如果忘记, 请联系管理员"});
			const pwdOrg = obj.pwdOrg.replace(/(\s*$)/g, "").replace( /^\s*/, '');
			const pwd_match_res = await MdFilter.bcrypt_match_Prom(pwdOrg, User.pwd);
			if(pwd_match_res.status != 200) return res.json({status: 400, message: "[server] 原密码错误，请重新操作"});
		}
		User.pwd = await MdFilter.encrypt_tProm(obj.pwd);
		const objSave = await User.save();
		if(Object.keys(req.query).length > 0) {
			const db_res = await GetDB.db(obtFilterObj(req, objSave._id));
			return res.json(db_res);
		} else {
			return res.json({status: 200, data: {object: objSave}, message: '[server] 修改成功'});
		}
	} catch(error) {
		console.log("/b1/User_putPwd", error);
		return res.json({status: 500, message: "[服务器错误: User_putPwd]"});
	}
}
const User_general = async(req, res, User, payload) => {
	try{
		const obj = req.body.general

		const same_param = {_id: {$ne: User._id}, "$or": []};
		const stints = [];
		if(obj.code) {
			// 只有管理员以上可以更改
			obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()
			if(obj.code !== User.code) {
				User.code = obj.code;
				same_param["$or"].push({code: obj.code});
				stints.push('code');
			}
		}

		if(obj.phonePre && obj.phoneNum) {
			obj.phonePre = obj.phonePre.replace(/^\s*/g,"");
			obj.phoneNum = obj.phoneNum.replace(/^\s*/g,"");
			obj.phonePre = MdFilter.get_phonePre_Func(obj.phonePre);
			if(!obj.phonePre) return res.json({status: 400, message: "[server] phonePre 错误"});

			obj.phone = obj.phonePre + obj.phoneNum;
			
			if(obj.phone !== User.phone) {
				User.phonePre = obj.phonePre;
				User.phoneNum = obj.phoneNum;
				User.phone = obj.phone;
				same_param["$or"].push({phone: obj.phone});
				stints.push('phonePre');
				stints.push('phoneNum');
			}
		}
		if(obj.email) {
			obj.email = obj.email.replace(/^\s*/g,"").toUpperCase();
			if(obj.email !== User.email) {
				User.email = obj.email;
				same_param["$or"].push({email: obj.email});
			}
		}

		if(stints.length > 0) {
			const errorInfo = MdFilter.Stint_Match_objs(StintUser, obj, stints);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		}

		if(same_param["$or"].length !== 0) {
			const objSame = await UserDB.findOne(same_param);
			if(objSame) return res.json({status: 400, message: '[server] 此用户账户已被占用, 请查看'});
		}

		if(!obj.Shop) obj.Shop = User.Shop;

		if(obj.role && (obj.role != User.role)) {
			obj.role = parseInt(obj.role);
			if(!ConfUser.role_Arrs.includes(obj.role)) return res.json({status: 400, message: '[server] 您设置的用户权限参数不存在'});
			if(obj.role <= payload.role) return res.json({status: 400, message: '[server] 您无权授予此权限'});
 
			if(obj.role >= ConfUser.role_set.boss && !obj.Shop) return res.json({status: 400, message: '[server] 请为该角色设置分店'});
			if(obj.role < ConfUser.role_set.boss) obj.Shop = null;
			User.role = obj.role;
		}

		if(obj.Shop && (obj.Shop != User.Shop)) {
			const role = obj.role || User.role;
			if(role >= ConfUser.role_set.boss) {
				if(!MdFilter.is_ObjectId_Func(obj.Shop)) return res.json({status: 400, message: '[server] 分店数据需要为 _id 格式'});
				if(payload.role >= ConfUser.role_set.manager)	return res.json({status: 400, message: '[server] 修改用户所属店铺需要总公司管理权限'});
				const Shop = await ShopDB.findOne({_id: obj.Shop, Firm: payload.Firm});
				if(!Shop) return res.json({status: 400, message: '[server] 没有找到此分店信息'});
				User.Shop = obj.Shop;
			} else {
				User.Shop = null;
			}
		}

		if(payload._id != User._id) User.User_upd = payload._id;

		const objSave = await User.save();

		if(Object.keys(req.query).length > 0) {
			const db_res = await GetDB.db(obtFilterObj(req, objSave._id));
			return res.json(db_res);
		} else {
			return res.json({status: 200, data: {object: objSave}, message: '[server] 修改成功'});
		}
	} catch(error) {
		console.log("/b1/User_general", error);
		return res.json({status: 500, message: "[服务器错误: User_general]"});
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
		if(payload.role >= User.role) return res.json({status: 400, message: "[server] 您没有权限删除此用户"});

		const objDel = await UserDB.deleteOne({_id: User._id});
		return res.json({status: 200, message: '[server] 删除成功'})
	} catch(error) {
		console.log("/b1/UserDelete", error);
		return res.json({status: 500, message: "[服务器错误: UserDelete]"});
	}
}











exports.Users = async(req, res) => {
	console.log("/b1/Users");
	try {
		const dbs_res = await GetDB.dbs(obtFilterObj(req));
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Users", error);
		return res.json({status: 500, message: "[服务器错误: Users]"});
	}
}

exports.User = async(req, res) => {
	console.log("/b1/User")
	try {
		const db_res = await GetDB.db(obtFilterObj(req, req.params.id));
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/User", error);
		return res.json({status: 500, message: "[服务器错误: User]"});
	}
}

const obtFilterObj = (req, id) => {
	const DB_filter =  {
		payload: req.payload,
		queryObj: req.query,

		objectDB: UserDB,
		path_Callback: User_path_Func,
		dbName: dbUser,
	};
	if(id) DB_filter.id = id;

	return DB_filter;
}


const User_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	pathObj.role = {$gte: payload.role};
	if(payload.Shop) pathObj.Shop = payload.Shop;
	if(payload.role == ConfUser.role_set.staff || payload.role == ConfUser.role_set.worker) pathObj._id = payload._id;

	if(!queryObj) return;
}