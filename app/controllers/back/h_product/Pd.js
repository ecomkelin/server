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
const SkuDB = require('../../../models/product/Sku');

const _ = require('underscore');

exports.PdDelete = async(req, res) => {
	console.log("/b1/PdDelete")
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Pd的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Pd_path_Func(pathObj, payload);

		const Pd = await PdDB.findOne(pathObj);
		if(!Pd) return res.json({status: 400, message: "[server] 没有找到此产品信息, 请刷新重试"});

		const Prod = await ProdDB.findOne({Pd: Pd._id});
		if(Prod) return res.json({status: 400, message: "[server] 请先删除产品中的商品"});

		for(let i=0; i<Pd.img_urls.length; i++) {
			await MdFiles.rmPicture(Pd.img_urls[i]);
		}

		const objDel = await PdDB.deleteOne({_id: Pd._id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/PdDelete", error);
		return res.json({status: 500, message: "[服务器错误: PdDelete]"});
	}
}

exports.PdPost = async(req, res) => {
	console.log("/b1/PdPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir:"/Pd", field: "img_urls", is_Array: true});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		if(obj.code) {
			// 如果输入了 编号 则编号必须是唯一;  注意 Pd code 没有转大写
			const errorInfo = MdFilter.Stint_Match_objs(StintPd, obj, ['code', 'nome']);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
			const objSame = await PdDB.findOne({'code': obj.code, Firm: payload.Firm});
			if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
		} else {
			const errorInfo = MdFilter.Stint_Match_objs(StintPd, obj, ['nome']);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		}

		if(isNaN(obj.price_regular)) return res.json({status: 400, message: '[server] 价格要为数字'});
		obj.price_regular = parseFloat(obj.price_regular);

		if(isNaN(obj.price_sale)) return res.json({status: 400, message: '[server] 价格要为数字'});
		obj.price_sale = parseFloat(obj.price_sale);


		if(!MdFilter.is_ObjectId_Func(obj.Brand)) obj.Brand = null;
		if(!MdFilter.is_ObjectId_Func(obj.Nation)) obj.Nation = null;

		if(!MdFilter.is_ObjectId_Func(obj.Categ)) {
			obj.Categ = null;
		} else {
			const Categ = await CategDB.findOne({_id: obj.Categ, Firm: payload.Firm, level: 2});
			if(!Categ) return res.json({status: 400, message: "[server] 您的二级分类不正确, 请输入正确的二级分类"});
		}

		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;
		const _object = new PdDB(obj);
		const objSave = await _object.save();

		return res.json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/PdPost", error);
		return res.json({status: 500, message: "[服务器错误: PdPost]: "+ error});
	}
}

exports.PdPut = async(req, res) => {
	console.log("/b1/PdPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Pd的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Pd_path_Func(pathObj, payload);

		const Pd = await PdDB.findOne(pathObj);
		if(!Pd) return res.json({status: 400, message: "[server] 没有找到此产品信息, 请刷新重试"});

		if(req.body.general) {
			Pd_general(res, req.body.general, Pd, payload);
		} else if(req.body.put_img_url) {
			Pd_put_img_url(res, req.body.put_img_url, Pd, payload);
		} else if(req.body.delete_img_urls) {
			Pd_delete_img_urls(res, req.body.delete_img_urls, Pd, payload);
		} else {
			// 判断是否用上传文件的形式 传递了数据
			const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Pd", field: "img_urls", is_Array: true});
			if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
			Pd_ImgPost(res, obj, Pd, payload);
		}
	} catch(error) {
		console.log("/b1/PdPut", error);
		return res.json({status: 500, message: "[服务器错误: PdPut]"});
	}
}

const Pd_general = async(res, obj, Pd, payload) => {
	try {
		if(obj.is_usable == 1 || obj.is_usable === true || obj.is_usable === 'true') Pd.is_usable = true;
		if(obj.is_usable == 0 || obj.is_usable === false || obj.is_usable === 'false') Pd.is_usable = false;

		if(obj.sort) {
			obj.sort = parseInt(obj.sort);
			if(!isNaN(obj.sort)) Pd.sort = obj.sort;
		}
		if(obj.desp) {
			Pd.desp = obj.desp;
		}

		const updManyProdObj = {};

		if(obj.price_regular) {
			obj.price_regular = parseFloat(obj.price_regular);
			if(!isNaN(obj.price_regular) && (Pd.price_regular != obj.price_regular)) {
				Pd.price_regular = obj.price_regular;
				updManyProdObj.price_regular = obj.price_regular;
			}
		}
		if(obj.price_sale) {
			obj.price_sale = parseFloat(obj.price_sale);
			if(!isNaN(obj.price_sale) && (Pd.price_sale != obj.price_sale)) {
				if(obj.price_sale >= Pd.price_regular) obj.price_sale = Pd.price_regular;
				Pd.price_sale = obj.price_sale;
				updManyProdObj.price_sale = obj.price_sale;
			}
		}
		if(!Pd.price_sale) Pd.price_sale = Pd.price_regular;
		if(obj.force && (obj.force.price == 1 || obj.force.price === true || obj.force.price === 'true')) {
			const Sku_UpdMany = await SkuDB.updateMany(
				{Pd: Pd._id, Firm: payload.Firm},
				{price_regular: Pd.price_regular, price_sale: Pd.price_sale},
			);
		}

		if(obj.code) {
			obj.code = obj.code.replace(/^\s*/g,"");	// 注意 Pd code 没有转大写
			if(obj.code && (obj.code != Pd.code)) {
				const errorInfo = MdFilter.Stint_Match_objs(StintPd, obj, ['code']);
				if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
				const objSame = await PdDB.findOne({'code': obj.code, Firm: payload.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
				updManyProdObj.code = obj.code;
				Pd.code = obj.code;
			}
		}
		if(obj.nome) {
			obj.nome = obj.nome.replace(/^\s*/g,"");	// 注意 Pd nome 没有转大写
			const errorInfo = MdFilter.Stint_Match_objs(StintPd, obj, ['nome']);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
			if(obj.nome != Pd.nome) {
				const objSame = await PdDB.findOne({'nome': obj.nome, Firm: payload.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
				updManyProdObj.nome = obj.nome;
				Pd.nome = obj.nome;
			}
		}
		if(obj.unit) {
			obj.unit = obj.unit.replace(/^\s*/g,"");	// 注意 Pd unit 没有转大写
			if(obj.unit != Pd.unit) {
				const objSame = await PdDB.findOne({'unit': obj.unit, Firm: payload.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
				updManyProdObj.unit = obj.unit;
				Pd.unit = obj.unit;
			}
		}

		if(obj.Nation && (obj.Nation != Pd.Nation)) {
			if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 国家数据需要为 _id 格式'});
			const Nation = await NationDB.findOne({_id: obj.Nation});
			if(!Nation) return res.json({status: 400, message: '[server] 没有找到此国家信息'});
			updManyProdObj.Nation = obj.Nation;
			Pd.Nation = obj.Nation;
		}
		if(obj.Brand && (obj.Brand != Pd.Brand)) {
			if(!MdFilter.is_ObjectId_Func(obj.Brand)) return res.json({status: 400, message: '[server] 品牌数据需要为 _id 格式'});
			const Brand = await BrandDB.findOne({_id: obj.Brand});
			if(!Brand) return res.json({status: 400, message: '[server] 没有找到此品牌信息'});
			updManyProdObj.Brand = obj.Brand;
			Pd.Brand = obj.Brand;
		}

		if(obj.Categ) {
			if(!MdFilter.is_ObjectId_Func(obj.Categ)) return res.json({status: 400, message: '[server] 请输入正确的分类'});
			if(String(obj.Categ) !== String(Pd.Categ) ) {
				const Categ = await CategDB.findOne({_id: obj.Categ, Firm: payload.Firm, level: 2});
				if(!Categ) return res.json({status: 400, message: "[server] 您的二级分类不正确, 请输入正确的二级分类"});
				updManyProdObj.Categ = obj.Categ;
				Pd.Categ = obj.Categ;
			}
		}

		Pd.User_upd = payload._id;

		const objSave = await Pd.save();
		if(!objSave) res.json({status: 400, message: "[server] 保存错误"});
		if(Object.keys(updManyProdObj).length != 0) {
			const Prod_UpdMany = await ProdDB.updateMany({Pd: Pd._id, Firm: payload.Firm}, updManyProdObj);
		}
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Pd_general]"});
	}
}

const Pd_delete_img_urls = async(res, obj, Pd, payload) => {
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

		Pd.User_upd = payload._id;
		const objSave = await Pd.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Pd_delete_img_urls]"});
	}
}
const Pd_put_img_url = async(res, obj, Pd, payload) => {
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
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Pd_put_img_url]"});
	}
}
const Pd_ImgPost = async(res, obj, Pd, payload) => {
	try {
		if(!obj.img_urls || obj.img_urls.length == 0) return res.json({status: 400, message: "[server] 请传输图片"});
		obj.img_urls.forEach(img_url => {
			Pd.img_urls.push(img_url);
		})

		const ProdUpdMany = await ProdDB.updateMany({Pd: Pd._id}, {img_urls: Pd.img_urls});

		const objSave = await Pd.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave, put_urls:obj.img_urls}, reference:{img_urls: obj.img_urls}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Pd_ImgPost]"});
	}
}












const Pd_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	if(payload.role >= ConfUser.role_set.boss) {
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
		const payload = req.payload;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: PdDB,
			path_Callback: Pd_path_Func,
			dbName: dbPd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Pds", error);
		return res.json({status: 500, message: "[服务器错误: Pds]"});
	}
}



exports.Pd = async(req, res) => {
	console.log("/b1/Pd");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: PdDB,
			path_Callback: Pd_path_Func,
			dbName: dbPd,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Pd", error);
		return res.json({status: 500, message: "[服务器错误: Pd]"});
	}
}
