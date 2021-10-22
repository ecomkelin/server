const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintCateg = require('../../../config/StintCateg.js');
const MdFilter = require('../../../middle/middleFilter');
const MdFiles = require('../../../middle/middleFiles');
const MdSafe = require('../../../middle/middleSafe');

const CategDB = require('../../../models/complement/Categ');

const PdDB = require('../../../models/product/Pd');

const _ = require('underscore');

exports.CategPost = async(req, res) => {
	console.log("/b1/CategPost");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Categ", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		let errorInfo = null;
		if(!obj.code) return res.json({status: 400, message: '[server] 请输入分类编号'});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintCateg.code);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		obj.Firm = curUser.Firm;
		obj.User_crt = curUser._id;

		const objSame = await CategDB.findOne({'code': obj.code, Firm: curUser.Firm});
		if(objSame) return res.json({status: 400, message: '[server] 分类编号或名称相同'});

		const _object = new CategDB(obj);

		if(obj.level == 2) {
			if(!MdFilter.is_ObjectId_Func(obj.Categ_far)) return res.json({status: 400, message: "[server] 父分类:请传递正确的数据 _id"});
			const Categ_far = await CategDB.findOne({_id: obj.Categ_far, Firm: curUser.Firm});
			if(!Categ_far.Categ_sons) Categ_far.Categ_sons = [];
			Categ_far.Categ_sons.push(_object._id);
			await Categ_far.save();
		} else {
			obj.level = 1;
		}

		let object = await _object.save();
		// kelin 为了 react 的 二级分类
		if(object.level === 2) {
			object = await CategDB.findOne({_id: object.Categ_far})
				.populate({path: 'Categ_sons'})
		}

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object}});
	} catch(error) {
		console.log("/b1/CategPost", error);
		return res.json({status: 500, message: "[服务器错误: CategPost]: "+ error});
	}
}

exports.CategDelete = async(req, res) => {
	console.log("/b1/CategDelete");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Categ的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Categ_path_Func(pathObj, curUser);

		const Categ = await CategDB.findOne(pathObj);
		if(!Categ) return res.json({status: 400, message: "[server] 没有找到此分类信息"});

		let Categ_far = null;
		if(Categ.level == 1) {
			const Categ_sec = await CategDB.findOne({Categ_far: Categ._id});
			if(Categ_sec) return res.json({status: 400, message: "[server] 此分类下还有子分类, 不可删除"});
		} else if(Categ.level == 2) {
			const Pd = await PdDB.findOne({Categ: Categ._id});
			if(Pd) return res.json({status: 400, message: "[server] 请先删除分类中的产品"});
			Categ_far = await CategDB.findOne({_id: Categ.Categ_far});
			Categ_far.Categ_sons.remove(id);
		}

		if(Categ.img_url && Categ.img_url.split("Categ").length > 1) await MdFiles.rmPicture(Categ.img_url);
		const objDel = await CategDB.deleteOne({_id: Categ._id});
		if(Categ_far) await Categ_far.save();

		return res.status(200).json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/CategDelete", error);
		return res.json({status: 500, message: "[服务器错误: CategDelete]"});
	}
}



exports.CategPut = async(req, res) => {
	console.log("/b1/CategPut");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Categ的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Categ_path_Func(pathObj, curUser);

		const Categ = await CategDB.findOne(pathObj);
		if(!Categ) return res.json({status: 400, message: "[server] 没有找到此分类信息, 请刷新重试"});

		if(req.body.general) {
			Categ_general(res, req.body.general, Categ, curUser);
		} else {
			const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Categ", field: "img_url"});
			if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
			Categ_general(res, obj, Categ, curUser);
		}
		
	} catch(error) {
		console.log("/b1/CategPut", error);
		return res.json({status: 500, message: "[服务器错误: CategPut]"});
	}
}
const Categ_general = async(res, obj, Categ, curUser) => {
	try{
		MdFilter.readonly_Func(obj);
		delete obj.level;
		delete obj.Categ_sons;

		let errorInfo = null;
		// (!errorInfo) && (obj.code) && (obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()) && (obj.code != Categ.code) 
		if(obj.code && (obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()) && (obj.code != Categ.code)) {
			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintCateg.code);
			if(!errorInfo) {
				const objSame = await CategDB.findOne({_id: {$ne: Categ._id}, code: obj.code, Firm: curUser.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 此分类编号已被占用, 请查看'});
			}
		}
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		// 如果不是顶级分类 并且新的父分类与原父分类不同
		if((Categ.level > 1) && (obj.Categ_far && obj.Categ_far != Categ.Categ_far)) {
			// 新的父分类添加子分类 _id
			if(!MdFilter.is_ObjectId_Func(obj.Categ_far)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
			const Categ_far = await CategDB.findOne({_id: obj.Categ_far, Firm: curUser.Firm});
			if(!Categ_far) return res.json({status: 400, message: "没有找到要改变的父分类"});

			if(!Categ_far.Categ_sons) Categ_far.Categ_sons = [];
			Categ_far.Categ_sons.push(id);
			const Categ_farSave = await Categ_far.save();
			if(!Categ_farSave) return res.json({status: 400, message: "父分类 存储错误"})

			// 原父分类删除子分类 _id
			const Org_far = await CategDB.findOne({_id: Categ.Categ_far});
			if(!Org_far) return res.json({status: 400, message: "原父分类信息错误"});
			Org_far.Categ_sons.remove(id);
			const Org_farSave = await Org_far.save();
			if(!Org_farSave) return res.json({status: 400, message: "原父分类 存储错误"})
		}

		if(obj.img_url && (obj.img_url != Categ.img_url) && Categ.img_url && Categ.img_url.split("Categ").length > 1){
			await MdFiles.rmPicture(Categ.img_url);
		}
		
		obj.User_upd = curUser._id;
		const _object = _.extend(Categ, obj);

		let object = await Categ.save();
		// kelin 为了 react 的 二级分类
		if(object.level === 2) {
			object = await CategDB.findOne({_id: object.Categ_far})
				.populate({path: 'Categ_sons'})
		}
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Categ_general]"});
	}
}












const Categs_path_Func = (pathObj, curUser, queryObj) => {
	pathObj.Firm = curUser.Firm;
	if(curUser.role > ConfUser.role_set.manager) pathObj.is_usable = 1;

	if(!queryObj) return;
	if(MdFilter.is_ObjectId_Func(queryObj.Categ_far)) {
		pathObj["Categ_far"] = queryObj.Categ_far;
	} else {
		pathObj.level = 1;
	}
}
const Categ_path_Func = (pathObj, curUser, queryObj) => {
	pathObj.Firm = curUser.Firm;
	if(curUser.role > ConfUser.role_set.manager) pathObj.is_usable = 1;
}

const dbCateg = 'Categ';
exports.Categs = async(req, res) => {
	console.log("/b1/Categs");
	try {
		const curUser = req.curUser;
		const GetDB_Filter = {
			Identity: curUser,
			queryObj: req.query,
			objectDB: CategDB,
			path_Callback: Categs_path_Func,
			dbName: dbCateg,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/Categs", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Categs]"});
	}
}

exports.Categ = async(req, res) => {
	console.log("/b1/Categ");
	try {
		const curUser = req.curUser;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: curUser,
			queryObj: req.query,
			objectDB: CategDB,
			path_Callback: Categs_path_Func,
			dbName: dbCateg,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/b1/Categ", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Categ]"});
	}
}
