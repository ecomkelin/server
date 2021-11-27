const GetDB = require('../../_db/GetDB');
const ConfUser = require('../../../config/ConfUser.js');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');

const StintPd = require('../../../config/StintPd.js');
const PdDB = require('../../../models/product/Pd');
const ProdDB = require('../../../models/product/Prod');
const SkuDB = require('../../../models/product/Sku');

const _ = require('underscore');

exports.ProdPost = async(req, res) => {
	console.log("/b1/ProdPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		if(req.body.Pd) {		// 从总公司同步
			Prod_PdSynchronize(res, req.body.Pd, payload);
		} else {		// 如果是单一店铺 则自己添加
			const obj = await MdFiles.mkPicture_prom(req, {img_Dir:"/Prod", field: "img_urls", is_Array: true});
			if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
			Prod_PdNull(res, obj, payload);
		}		
	} catch(error) {
		console.log("/b1/ProdPost", error)
		return res.json({status: 500, message: "[服务器错误: ProdPost]: "+ error});
	}
}
const Prod_PdNull = async(res, obj, payload) => {
	try {
		obj.Pd = null;
		if(obj.code) {
			// 如果输入了 编号 则编号必须是唯一;  注意 Prod code 没有转大写
			const errorInfo = MdFilter.Stint_Match_objs(StintProd, obj, ['code', 'nome']);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
			const objSame = await ProdDB.findOne({'code': obj.code, Firm: payload.Firm});
			if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
		} else {
			const errorInfo = MdFilter.Stint_Match_objs(StintProd, obj, ['nome']);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		}

		if(isNaN(obj.price_regular)) return res.json({status: 400, message: '[server] 价格要为数字'});
		obj.price_regular = parseFloat(obj.price_regular);

		if(isNaN(obj.price_sale)) return res.json({status: 400, message: '[server] 价格要为数字'});
		obj.price_sale = parseFloat(obj.price_sale);

		if(!MdFilter.is_ObjectId_Func(obj.Brand)) obj.Brand = null;
		if(!MdFilter.is_ObjectId_Func(obj.Nation)) obj.Nation = null;
		if(!MdFilter.is_ObjectId_Func(obj.Categ)) obj.Categ = null;

		if(!isNaN(obj.limit_quantity)) obj.limit_quantity = parseInt(obj.limit_quantity);
		if(!isNaN(obj.quantity)) obj.quantity = parseInt(obj.quantity);
		if(!isNaN(obj.quantity_alert)) obj.quantity_alert = parseInt(obj.quantity_alert);
		obj.allow_backorder = (obj.allow_backorder == 1 || obj.allow_backorder === true || obj.allow_backorder === 'true') ? true : false; 
		Prod_save(res, obj, payload, null);
	} catch(error) {
		console.log("Prod PdNull", error)
		return res.json({status: 500, message: "[服务器错误: Prod_PdNull]: "+ error});
	}
}
const Prod_PdSynchronize = async(res, Pd_id, payload) => {
	try {
		const obj = {};
		if(!MdFilter.is_ObjectId_Func(Pd_id)) return res.json({status: 400, message: '[server] 请输入需要同步的产品_id'});
		Pd = await PdDB.findOne({_id: Pd_id, Firm: payload.Firm});
		if(!Pd) return res.json({status: 400, message: '[server] 没有找到同步产品信息'});

		const objSame = await ProdDB.findOne({Pd: Pd_id, Shop: payload.Shop, Firm: payload.Firm});
		if(objSame) return res.json({status: 400, message: '[server] 此商品之前已经被同步', data: {object: objSame}});
		obj.Pd = Pd._id;
		obj.Shop = payload.Shop;
		if(Pd.Categ) obj.Categ = Pd.Categ;
		obj.sort = Pd.sort;

		obj.code = Pd.code;
		obj.nome = Pd.nome;
		obj.price_regular = Pd.price_regular;
		obj.price_sale = Pd.price_sale;
		obj.img_urls = Pd.img_urls;
		obj.Brand = Pd.Brand;
		obj.Nation = Pd.Nation;

		obj.desp = Pd.desp;
		obj.unit = Pd.unit;
		obj.langs = Pd.langs;

		obj.price_unit = obj.price_min = obj.price_max = Pd.price_regular;
		Prod_save(res, obj, payload, Pd)
	} catch(error) {
		console.log("Prod Synchronize", error);
		return res.json({status: 500, message: "[服务器错误: Prod_PdSynchronize]: "+ error});
	}
}

const Prod_save = async(res, obj, payload, Pd) => {
	try {
		obj.is_usable = (obj.is_usable == 1 || obj.is_usable === true || obj.is_usable === 'true') ? true: false;
		obj.Shop = payload.Shop;
		obj.is_usable = false;
		obj.Skus = [];

		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;
		const _object = new ProdDB(obj);

		// 创建 obj_Sku
		const obj_Sku = {};
		obj_Sku.Pd = obj.Pd;
		obj_Sku.Prod = _object._id;
		obj_Sku.attrs = null;
		obj_Sku.is_usable = false;
		obj_Sku.price_regular = obj.price_regular
		obj_Sku.price_sale = obj.price_sale
		obj_Sku.Firm = obj.Firm
		obj_Sku.Shop = obj.Shop
		const _Sku = new SkuDB(obj_Sku);

		_object.Skus.push(_Sku._id);
		const objSave = await _object.save();
		if(!objSave) return res.json({status: 400, message: '[server] 商品保存失败'});

		const SkuSave = await _Sku.save();
		if(!SkuSave) return res.json({status: 400, message: '[server] 商品obj_Sku保存失败'});

		// 如果是同步 则需要把产品下的商品 _id 推送到产品中去
		if(Pd) {
			Pd.Prods.push(objSave._id);
			await Pd.save();
		}

		return res.json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("Prod save", error);
		return res.json({status: 500, message: "[服务器错误: Prod_save]: "+ error});
	}
}




exports.ProdDelete = async(req, res) => {
	console.log("/b1/ProdDelete")
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Prod_path_Func(pathObj, payload);

		const Prod = await ProdDB.findOne(pathObj);
		if(!Prod) return res.json({status: 400, message: "[server] 没有找到此商品信息, 请刷新重试"});

		const Skus = await SkuDB.find({Prod: Prod._id});
		if(Skus && Skus.length > 1) return res.json({status: 400, message: "[server] 请先删除商品中的 非默认Sku"});

		const Pd = await PdDB.findOne({_id: Prod.Pd});

		const index = MdFilter.indexArr_Func(Pd.Prods, Prod._id);
		Pd.Prods.splice(index, 1);

		const objDel = await ProdDB.deleteOne({_id: Prod._id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/ProdDelete", error);
		return res.json({status: 500, message: "[服务器错误: ProdDelete]"});
	}
}



exports.ProdPut = async(req, res) => {
	console.log("/b1/ProdPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Prod_path_Func(pathObj, payload);

		const Prod = await ProdDB.findOne(pathObj);
		if(!Prod) return res.json({status: 400, message: "[server] 没有找到此商品信息, 请刷新重试"});

		const obj = req.body.general;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 参数对象数据"});

		if(obj.desp) Prod.desp = obj.desp.replace(/^\s*/g,"");
		if(obj.unit) Prod.unit = obj.unit.replace(/^\s*/g,"");
		if(obj.sort) {
			obj.sort = parseInt(obj.sort);
			if(!isNaN(obj.sort)) Prod.sort = obj.sort;
		}

		if(obj.is_usable == 1 || obj.is_usable === true || obj.is_usable === 'true') Prod.is_usable = true;
		if(obj.is_usable == 0 || obj.is_usable === false || obj.is_usable === 'false') Prod.is_usable = false;

		if(!Prod.Pd) {	// 如果是单店 可以修改名称等 暂时没有做
			Prod.code = obj.code.replace(/^\s*/g,"");	// 注意 Pd code 没有转大写
			Prod.nome = obj.nome.replace(/^\s*/g,"");	// 注意 Pd code 没有转大写
			Prod.Nation = obj.Nation;	// 注意 Pd code 没有转大写
			Prod.Brand = obj.Brand;	// 注意 Pd code 没有转大写
			Prod.Categ = obj.Categ;	// 注意 Pd code 没有转大写
			if(obj.price_regular) {
				obj.price_regular = parseFloat(obj.price_regular);
				if(!isNaN(obj.price_regular)) Prod.price_regular = obj.price_regular;
			}
			if(obj.price_sale) {
				obj.price_sale = parseFloat(obj.price_sale);
				if(!isNaN(obj.price_sale)) Prod.price_sale = obj.price_sale;
			}
		}
		Prod.User_upd = payload._id;

		const objSave = await Prod.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/ProdPut", error);
		return res.json({status: 500, message: "[服务器错误: ProdPut]"});
	}
}
























const Prod_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;

	if(payload.role >= ConfUser.role_set.boss) {
		pathObj.Shop = payload.Shop;
	} else {
		if(queryObj.Shops) {
			const ids = MdFilter.getArray_ObjectId_Func(queryObj.Shops);
			pathObj.Shop = {$in: ids};
		}
	}

	if(!queryObj) return;
	if(queryObj.Shops) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Shops);
		pathObj["Shop"] = {$in: ids};
	}
	if(queryObj.Brands) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Brands);
		pathObj["Brand"] = {$in: ids};
	}
	if(queryObj.Nations) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Nations);
		pathObj["Nation"] = {$in: ids};
	}
	if(queryObj.Categs) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Categs);
		pathObj["Categ"] = {$in: ids};
	}
}


const dbProd = 'Prod';
exports.Prods = async(req, res) => {
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: ProdDB,
			path_Callback: Prod_path_Func,
			dbName: dbProd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Prods]"});
	}
}

exports.Prod = async(req, res) => {
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: ProdDB,
			path_Callback: Prod_path_Func,
			dbName: dbProd,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Prod]"});
	}
}
