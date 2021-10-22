const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintPd = require('../../../config/StintPd.js');
const MdFilter = require('../../../middle/middleFilter');
const MdFiles = require('../../../middle/middleFiles');
const MdSafe = require('../../../middle/middleSafe');

const PdDB = require('../../../models/product/Pd');

const CategDB = require('../../../models/complement/Categ');
const BrandDB = require('../../../models/complement/Brand');
const NationDB = require('../../../models/address/Nation');
const ProdDB = require('../../../models/product/Prod');

const _ = require('underscore');

exports.PdDelete = async(req, res) => {
	console.log("/b1/PdDelete")
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Pd的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Pd_path_Func(pathObj, curUser);

		const Pd = await PdDB.findOne(pathObj);
		if(!Pd) return res.json({status: 400, message: "[server] 没有找到此产品信息, 请刷新重试"});

		const Prod = await ProdDB.findOne({Pd: Pd._id});
		if(Prod) return res.json({status: 400, message: "[server] 请先删除产品中的商品"});

		for(let i=0; i<Pd.img_urls.length; i++) {
			await MdFiles.rmPicture(Pd.img_urls[i]);
		}

		const objDel = await PdDB.deleteOne({_id: Pd._id});
		return res.status(200).json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/PdDelete", error);
		return res.status(500).json({status: 500, message: "[服务器错误: PdDelete]"});
	}
}

exports.PdPost = async(req, res) => {
	console.log("/b1/PdPost");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir:"/Pd", field: "img_urls", is_Array: true});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		let errorInfo = null;
		if(!errorInfo && obj.code) {
			// 如果输入了 编号 则编号必须是唯一;
			errorInfo = MdFilter.Stint_Match_Func(obj.code, StintPd.code);
			if(!errorInfo) {
				const objSame = await PdDB.findOne({'code': obj.code, Firm: curUser.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
			}
		}
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintPd.nome);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(!obj.price_regular) return res.json({status: 400, message: '[server] 请输入产品默认价格'});
		obj.price_regular = parseFloat(obj.price_regular);
		if(isNaN(obj.price_regular)) return res.json({status: 400, message: '[server] 价格要为数字'});

		if(!MdFilter.is_ObjectId_Func(obj.Brand)) obj.Brand = null;
		if(!MdFilter.is_ObjectId_Func(obj.Nation)) obj.Nation = null;

		if(!MdFilter.is_ObjectId_Func(obj.Categ)) {
			obj.Categ = null;
		} else {
			const Categ = await CategDB.findOne({_id: obj.Categ, Firm: curUser.Firm, level: 2});
			if(!Categ) return res.json({status: 400, message: "[server] 您的二级分类不正确, 请输入正确的二级分类"});
		}

		obj.Firm = curUser.Firm;
		obj.User_crt = curUser._id;
		const _object = new PdDB(obj);
		const objSave = await _object.save();

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/PdPost", error);
		return res.status(500).json({status: 500, message: "[服务器错误: PdPost]: "+ error});
	}
}

exports.PdPut = async(req, res) => {
	console.log("/b1/PdPut");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Pd的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Pd_path_Func(pathObj, curUser);

		const Pd = await PdDB.findOne(pathObj);
		if(!Pd) return res.json({status: 400, message: "[server] 没有找到此产品信息, 请刷新重试"});

		if(req.body.general) {
			Pd_general(res, req.body.general, Pd, curUser);
		} else if(req.body.put_img_url) {
			Pd_put_img_url(res, req.body.put_img_url, Pd, curUser);
		} else if(req.body.delete_img_urls) {
			Pd_delete_img_urls(res, req.body.delete_img_urls, Pd, curUser);
		} else {
			// 判断是否用上传文件的形式 传递了数据
			const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Pd", field: "img_urls", is_Array: true});
			if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
			Pd_ImgPost(res, obj, Pd, curUser);
		}
	} catch(error) {
		console.log("/b1/PdPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: PdPut]"});
	}
}

const Pd_general = async(res, obj, Pd, curUser) => {
	try {

		let errorInfo = null;
		if(!errorInfo && obj.code && (obj.code != Pd.code)) {
			obj.code = obj.code.replace(/^\s*/g,"");
			if(obj.code) {
				errorInfo = MdFilter.Stint_Match_Func(obj.code, StintPd.code);
				if(!errorInfo) {
					const objSame = await PdDB.findOne({'code': obj.code, Firm: curUser.Firm});
					if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
					const code_UpdMany = await ProdDB.updateMany({Pd: Pd._id}, {code: obj.code});
					Pd.code = obj.code;
				}
			} else {
				Pd.code = '';
			}
		}
		if(obj.nome && (obj.nome != Pd.nome)) {
			errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintPd.nome);
			if(!errorInfo) {
				const nome_UpdMany = await ProdDB.updateMany({Pd: Pd._id, Firm: curUser.Firm}, {nome: obj.nome});
				Pd.nome = obj.nome;
			}
		}
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(obj.price_regular) {
			obj.price_regular = parseFloat(obj.price_regular);
			if(!isNaN(obj.price_regular)) Pd.price_regular = obj.price_regular;
		}

		if(obj.Nation && (obj.Nation != Pd.Nation)) {
			if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 国家数据需要为 _id 格式'});
			const Nation = await NationDB.findOne({_id: obj.Nation});
			if(!Nation) return res.json({status: 400, message: '[server] 没有找到此国家信息'});
			const Nation_UpdMany = await ProdDB.updateMany({Pd: Pd._id, Firm: curUser.Firm}, {Nation: obj.Nation});
			Pd.Nation = obj.Nation;
		}
		if(obj.Brand && (obj.Brand != Pd.Brand)) {
			if(!MdFilter.is_ObjectId_Func(obj.Brand)) return res.json({status: 400, message: '[server] 品牌数据需要为 _id 格式'});
			const Brand = await BrandDB.findOne({_id: obj.Brand});
			if(!Brand) return res.json({status: 400, message: '[server] 没有找到此品牌信息'});
			const Brand_UpdMany = await ProdDB.updateMany({Pd: Pd._id, Firm: curUser.Firm}, {Brand: obj.Brand});
			Pd.Brand = obj.Brand;
		}

		if(obj.is_usable_Firm && (obj.is_usable_Firm != Pd.is_usable_Firm)) {
			if(obj.is_usable_Firm) obj.is_usable = true;
			const usable_UpdMany = await ProdDB.updateMany({Pd: Pd._id, Firm: curUser.Firm}, {is_usable_Firm: obj.is_usable_Firm});
			Pd.is_usable_Firm = obj.is_usable_Firm;
		}

		if(obj.Categ) {
			if(!MdFilter.is_ObjectId_Func(obj.Categ)) return res.json({status: 400, message: '[server] 请输入正确的分类'});
			if(String(obj.Categ) !== String(Pd.Categ) ) {
				const Categ = await CategDB.findOne({_id: obj.Categ, Firm: curUser.Firm, level: 2});
				if(!Categ) return res.json({status: 400, message: "[server] 您的二级分类不正确, 请输入正确的二级分类"});
				const Categ_UpdMany = await ProdDB.updateMany({Pd: Pd._id, Firm: curUser.Firm}, {Categ: obj.Categ});
				Pd.Categ = obj.Categ;
			}
		}

		Pd.User_upd = curUser._id;

		const objSave = await Pd.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Pd_general]"});
	}
}
const Pd_delete_img_urls = async(res, obj, Pd, curUser) => {
	try{
		const img_urls = obj.img_urls
		if(!img_urls || img_urls.length == 0) return res.json({status: 400, message: "[server] 请传递需要删除的图片名称"});
		let flag = 0;
		for(let i=0; i<img_urls.length; i++) {
			const index = MdFilter.indexArr_Func(Pd.img_urls, img_urls[i]);
			// console.log("/b1/PdPut_ImgDelete", img_urls[i])
			if(index >= 0) {
				flag = 1;
				Pd.img_urls.splice(index, 1);
				await MdFiles.rmPicture(img_urls[i]);
			}
		}
		if(flag == 0) return res.json({status: 400, message: '[server] 您传递的数据与产品图片不匹配'});

		const ProdUpdMany = await ProdDB.updateMany({Pd: Pd._id}, {img_urls: Pd.img_urls});

		Pd.User_upd = curUser._id;
		const objSave = await Pd.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Pd_delete_img_urls]"});
	}
}
const Pd_put_img_url = async(res, obj, Pd, curUser) => {
	try{
		obj.sort = parseInt(obj.sort);
		const img_url = obj.img_url;
		if(!img_url || isNaN(obj.sort)) return res.json({status: 400, message: "[server] 参数传递不正确"});

		const index = MdFilter.indexArr_Func(Pd.img_urls, img_url);
		if(index < 0) return res.json({status: 400, message: "[server] 没有此图片"});
		if(index == obj.sort) return res.json({status: 400, message: "[server] 您没有改动位置"});
		Pd.img_urls.splice(index, 1);
		Pd.img_urls.splice(obj.sort, 0, img_url);

		const ProdUpdMany = await ProdDB.updateMany({Pd: Pd._id}, {img_urls: Pd.img_urls});

		const objSave = await Pd.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Pd_put_img_url]"});
	}
}
const Pd_ImgPost = async(res, obj, Pd, curUser) => {
	try {
		if(!obj.img_urls || obj.img_urls.length == 0) return res.json({status: 400, message: "[server] 请传输图片"});
		obj.img_urls.forEach(img_url => {
			Pd.img_urls.push(img_url);
		})

		const ProdUpdMany = await ProdDB.updateMany({Pd: Pd._id}, {img_urls: Pd.img_urls});

		const objSave = await Pd.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave, put_urls:obj.img_urls}, reference:{img_urls: obj.img_urls}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Pd_ImgPost]"});
	}
}












const Pd_path_Func = (pathObj, curUser, queryObj) => {
	pathObj.Firm = curUser.Firm;
	if(curUser.role >= ConfUser.role_set.boss) {
		pathObj.is_usable_Firm = 1;
		pathObj.is_usable = 1;
	}

	if(!queryObj) return;
	if(MdFilter.is_ObjectId_Func(queryObj.Brand) ) pathObj["Brand"] = queryObj.Brand;
	if(MdFilter.is_ObjectId_Func(queryObj.Nation) ) pathObj["Nation"] = queryObj.Nation;
	if(queryObj.Categs) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Categs);
		pathObj["Categ"] = {$in: ids};
	}
}


const dbPd = 'Pd';
exports.Pds = async(req, res) => {
	console.log("/b1/Pds");
	try {
		const curUser = req.curUser;
		const GetDB_Filter = {
			Identity: curUser,
			queryObj: req.query,
			objectDB: PdDB,
			path_Callback: Pd_path_Func,
			dbName: dbPd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/Pds", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Pds]"});
	}
}



exports.Pd = async(req, res) => {
	console.log("/b1/Pd");
	try {
		const curUser = req.curUser;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: curUser,
			queryObj: req.query,
			objectDB: PdDB,
			path_Callback: Pd_path_Func,
			dbName: dbPd,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/b1/Pd", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Pd]"});
	}
}
