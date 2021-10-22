const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintBrand = require('../../../config/StintBrand.js');
const MdFilter = require('../../../middle/middleFilter');
const MdFiles = require('../../../middle/middleFiles');
const MdSafe = require('../../../middle/middleSafe');

const BrandDB = require('../../../models/complement/Brand');

const NationDB = require('../../../models/address/Nation');
const PdDB = require('../../../models/product/Pd');

const _ = require('underscore');

exports.BrandPost = async(req, res) => {
	console.log("/b1/BrandPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Brand", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		let errorInfo = null;
		if(!obj.code) return res.json({status: 400, message: '[server] 请输入品牌编号'});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintBrand.code);
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintBrand.nome);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		// if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 请输入品牌所属国家'});
		// const Nation = await NationDB.findOne({_id: obj.Nation});
		// if(!Nation) return res.json({status: 400, message: '[server] 没有找到您选择的国家信息'});

		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;

		const objSame = await BrandDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}], Firm: payload.Firm});
		if(objSame) return res.json({status: 400, message: '[server] 品牌编号或名称相同'});
		const _object = new BrandDB(obj);
		const objSave = await _object.save();

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/BrandPost", error);
		return res.status(500).json({status: 500, message: "[服务器错误: BrandPost]: "+ error});
	}
}

exports.BrandDelete = async(req, res) => {
	console.log("/b1/BrandDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Brand的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Brand_path_Func(pathObj, payload);

		const Brand = await BrandDB.findOne(pathObj);
		if(!Brand) return res.json({status: 400, message: "[server] 没有找到此品牌"});

		const Pd = await PdDB.findOne({Brand: Brand._id});
		// console.log(Pd);
		if(Pd) return res.json({status: 400, message: "[server] 请先删除品牌中的产品"});

		if(Brand.img_url && Brand.img_url.split("Brand").length > 1) await MdFiles.rmPicture(Brand.img_url);
		const objDel = await BrandDB.deleteOne({_id: Brand._id});
		return res.status(200).json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/BrandDelete", error);
		return res.status(500).json({status: 500, message: "[服务器错误: BrandDelete]"});
	}
}



exports.BrandPut = async(req, res) => {
	console.log("/b1/BrandPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Brand的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Brand_path_Func(pathObj, payload);

		const Brand = await BrandDB.findOne(pathObj);
		if(!Brand) return res.json({status: 400, message: "[server] 没有找到此品牌信息, 请刷新重试"});

		let obj = req.body.general;
		if(!obj) obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Brand", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		MdFilter.readonly_Func(obj);

		let errorInfo = null;
		// (!errorInfo) && (obj.code) && (obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()) && (obj.code != Brand.code) 
		if(obj.code && (obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()) && (obj.code != Brand.code)) {
			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintBrand.code);
			if(!errorInfo) {
				const objSame = await BrandDB.findOne({_id: {$ne: Brand._id}, code: obj.code, Firm: payload.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 此品牌编号已被占用, 请查看'});
			}
		}
		if(!errorInfo && obj.nome && (obj.nome != Brand.nome)) {
			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintBrand.nome);
			if(!errorInfo) {
				const objSame = await BrandDB.findOne({_id: {$ne: Brand._id}, nome: obj.nome, Firm: payload.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 此品牌名称已被占用, 请查看'});
			}
		}

		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(obj.Nation && (obj.Nation != Brand.Nation)) {
			if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 国家数据需要为 _id 格式'});
			const Nation = await NationDB.findOne({_id: obj.Nation});
			if(!Nation) return res.json({status: 400, message: '[server] 没有找到此国家信息'});
		}
		if(obj.img_url && (obj.img_url != Brand.img_url) && Brand.img_url && Brand.img_url.split("Brand").length > 1){
			await MdFiles.rmPicture(Brand.img_url);
		}

		obj.User_upd = payload._id;
		const _object = _.extend(Brand, obj);

		const objSave = await Brand.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/BrandPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: BrandPut]"});
	}
}








const Brand_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	if(payload.role > ConfUser.role_set.manager) {
		pathObj.is_usable = 1;
	}

	if(!queryObj) return;
	if(queryObj.Nations) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Nations);
		pathObj["Nation"] = {$in: ids};
	}
}

const dbBrand = 'Brand';
exports.Brands = async(req, res) => {
	console.log("/b1/Brands");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			Identity: payload,
			queryObj: req.query,
			objectDB: BrandDB,
			path_Callback: Brand_path_Func,
			dbName: dbBrand,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/Brands", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Brands]"});
	}
}

exports.Brand = async(req, res) => {
	console.log("/b1/Brand");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: payload,
			queryObj: req.query,
			objectDB: BrandDB,
			path_Callback: Brand_path_Func,
			dbName: dbBrand,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/b1/Brand", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Brand]"});
	}
}