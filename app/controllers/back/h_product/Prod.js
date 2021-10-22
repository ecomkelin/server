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
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		let obj = {};
		let Pd = null;
		if(req.body.Pd) {		// 从总公司同步
			if(!MdFilter.is_ObjectId_Func(req.body.Pd)) return res.json({status: 400, message: '[server] 请输入需要同步的产品_id'});
			Pd = await PdDB.findOne({_id: req.body.Pd, Firm: curUser.Firm});
			if(!Pd) return res.json({status: 400, message: '[server] 没有找到同步产品信息'});
			
			const objSame = await ProdDB.findOne({Pd: obj.Pd, Shop: obj.Shop, Firm: curUser.Firm});
			if(objSame) return res.status(205).json({status: 200, message: '[server] 此商品之前已经被同步', data: {object: objSame}});
			obj.Pd = Pd._id;
			if(Pd.Categ) obj.Categ = Pd.Categ;
			obj.sort = Pd.sort;

			obj.code = Pd.code;
			obj.nome = Pd.nome;
			obj.img_urls = Pd.img_urls;
			obj.Brand = Pd.Brand;
			obj.Nation = Pd.Nation;
			obj.is_usable_Firm = Pd.is_usable_Firm;

			obj.desp = Pd.desp;
			obj.unit = Pd.unit;
			obj.langs = Pd.langs;

			obj.price = obj.price_min = obj.price_max = Pd.price_regular;
		} else if(req.body.obj) {		// 如果是单一店铺 则自己添加
			obj = req.body.obj;

			let errorInfo = null;
			if(!errorInfo && obj.code) {
				errorInfo = MdFilter.Stint_Match_Func(obj.code, StintPd.code);
				if(!errorInfo) {
					const objSame = await PdDB.findOne({'code': obj.code, Firm: curUser.Firm});
					if(objSame) return res.json({status: 400, message: '[server] 产品编号相同'});
				}
			}

			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintPd.nome);
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

			if(!obj.price) return res.json({status: 400, message: '[server] 请输入产品默认价格'});
			obj.price = obj.price_min = obj.price_max = parseFloat(obj.price);
			if(isNaN(obj.price)) return res.json({status: 400, message: '[server] 价格要为数字'});

			if(!MdFilter.is_ObjectId_Func(obj.Nation)) obj.Nation = null;

			if(!MdFilter.is_ObjectId_Func(obj.Brand)) obj.Brand = null;

			if(!MdFilter.is_ObjectId_Func(obj.Categ)) obj.Categ = null;
		} else {
			return res.json({status: 400, message: "[server] 请传递正确的数据"});
		}

		if(curUser.role < ConfUser.role_set.boss) {
			if(!MdFilter.is_ObjectId_Func(req.body.Shop)) return res.json({status: 400, message: '[server] 请输入商品所属分店'});
			const Shop = await ShopDB.findOne({_id: req.body.Shop, Firm: curUser.Firm});
			if(!Shop) return res.json({status: 400, message: '[server] 没有找到该分店'});
			obj.Shop = Shop._id;
		} else {
			obj.Shop = curUser.Shop;
		}

		obj.is_usable = false;
		obj.Skus = [];

		obj.Firm = curUser.Firm;
		obj.User_crt = curUser._id;
		const _object = new ProdDB(obj);

		// 创建 obj_Sku
		const obj_Sku = {};
		obj_Sku.Pd = obj.Pd;
		obj_Sku.Prod = _object._id;
		obj_Sku.attrs = null;
		obj_Sku.is_usable = false;
		obj_Sku.price_sale = obj_Sku.price_regular = obj.price
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

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/ProdPost", error)
		return res.status(500).json({status: 500, message: "[服务器错误: ProdPost]: "+ error});
	}
}




exports.ProdDelete = async(req, res) => {
	console.log("/b1/ProdDelete")
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Prod_path_Func(pathObj, curUser);

		const Prod = await ProdDB.findOne(pathObj);
		if(!Prod) return res.json({status: 400, message: "[server] 没有找到此商品信息, 请刷新重试"});

		const Skus = await SkuDB.find({Prod: Prod._id});
		if(Skus && Skus.length > 1) return res.json({status: 400, message: "[server] 请先删除商品中的 非默认Sku"});

		const Pd = await PdDB.findOne({_id: Prod.Pd});

		const index = MdFilter.indexArr_Func(Pd.Prods, Prod._id);
		Pd.Prods.splice(index, 1);

		const objDel = await ProdDB.deleteOne({_id: Prod._id});
		return res.status(200).json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/ProdDelete", error);
		return res.status(500).json({status: 500, message: "[服务器错误: ProdDelete]"});
	}
}



exports.ProdPut = async(req, res) => {
	console.log("/b1/ProdPut");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Prod_path_Func(pathObj, curUser);

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
		if(obj.is_usable == 1 || obj.is_usable == true || obj.is_usable == 'true') Prod.is_usable = true;
		if(obj.is_usable == 0 || obj.is_usable == false || obj.is_usable == 'false') Prod.is_usable = false;

		Prod.User_upd = curUser._id;

		const objSave = await Prod.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/ProdPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: ProdPut]"});
	}
}
























const Prod_path_Func = (pathObj, curUser, queryObj) => {
	pathObj.Firm = curUser.Firm;

	if(curUser.role >= ConfUser.role_set.boss) {
		pathObj.Shop = curUser.Shop;
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
		const curUser = req.curUser;
		const GetDB_Filter = {
			Identity: curUser,
			queryObj: req.query,
			objectDB: ProdDB,
			path_Callback: Prod_path_Func,
			dbName: dbProd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Prods]"});
	}
}

exports.Prod = async(req, res) => {
	try {
		const curUser = req.curUser;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: curUser,
			queryObj: req.query,
			objectDB: ProdDB,
			path_Callback: Prod_path_Func,
			dbName: dbProd,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Prod]"});
	}
}
