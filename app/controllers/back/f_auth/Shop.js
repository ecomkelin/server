const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintShop = require('../../../config/StintShop.js');
const MdFilter = require('../../../middle/middleFilter');
const MdFiles = require('../../../middle/middleFiles');
const MdSafe = require('../../../middle/middleSafe');

const ShopDB = require('../../../models/auth/Shop');

const CitaDB = require('../../../models/address/Cita');

const ProdDB = require('../../../models/product/Prod');
const UserDB = require('../../../models/auth/User');

const _ = require('underscore');

exports.ShopPost = async(req, res) => {
	console.log("/b1/ShopPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
		let obj = req.body.obj;
		if(!obj) obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Shop", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		// 判断参数是否符合要求
		const errorInfo = MdFilter.Stint_Match_objs(StintShop, obj, ['code', 'nome']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();

		if(!MdFilter.is_ObjectId_Func(obj.Cita)) return res.json({status: 400, message: '[server] 请输入商店所在城市'});
		const Cita = await CitaDB.findOne({_id: obj.Cita});
		if(!Cita) return res.json({status: 400, message: '[server] 没有找到您选择的城市信息'});
		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;
		obj.price_ship = 0;
		obj.serve_Citas = [];
		const serve_Cita = {};
		serve_Cita.Cita = Cita._id;
		serve_Cita.price_ship = 0;
		obj.serve_Citas.push(serve_Cita);

		// 分店的编号或者名称是否相同
		const objSame = await ShopDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}], Firm: payload.Firm});
		if(objSame) return res.json({status: 400, message: '[server] 店铺编号或名称相同'});
		const _object = new ShopDB(obj);
		const objSave = await _object.save();
		if(!objSave) return res.json({status: 400, message: "[server] ShopPost 数据库保存失败"});
		// console.log("/b1/ShopPost", objSave)
		return res.json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/ShopPost", error);
		return res.json({status: 500, message: "[服务器错误: ShopPost]: "+ error});
	}
}


exports.ShopDelete = async(req, res) => {
	console.log("/b1/ShopDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Shop的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		Shop_path_Func(pathObj, payload);

		const Shop = await ShopDB.findOne(pathObj);
		if(!Shop) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		const User = await UserDB.findOne({Shop: Shop._id});
		if(User) return res.json({status: 400, message: "[server] 请先删除店铺中的所有用户"});

		const Prod = await ProdDB.findOne({Shop: Shop._id});
		if(Prod) return res.json({status: 400, message: "[server] 请先删除店铺中的商品"});

		if(Shop.img_url) await MdFiles.rmPicture(Shop.img_url);
		const objDel = await ShopDB.deleteOne({_id: Shop._id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/ShopDelete", error);
		return res.json({status: 500, message: "[服务器错误: ShopDelete]"});
	}
}



exports.ShopPut = async(req, res) => {
	console.log("/b1/ShopPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Shop的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		Shop_path_Func(pathObj, payload);

		const Shop = await ShopDB.findOne(pathObj);
		if(!Shop) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		if(req.body.general) {
			Shop_general(res, req.body.general, Shop, payload);
		} else if(req.body.serveCitaPost) {
			Shop_serveCitaPost(res, req.body.serveCitaPost, Shop);
		} else if(req.body.serveCitaPut) {
			Shop_serveCitaPut(res, req.body.serveCitaPut, Shop);
		} else if(req.body.serveCitaDelete) {
			Shop_serveCitaDelete(res, req.body.serveCitaDelete, Shop, payload);
		} else {
			// 判断是否用上传文件的形式 传递了数据
			const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Shop", field: "img_url"});
			if(!obj) return res.json({status: 400, message: "[server] 参数错误"});
			Shop_general(res, obj, Shop, payload);
		}
	} catch(error) {
		console.log("/b1/ShopPut", error);
		return res.json({status: 500, message: "[服务器错误: ShopPut]"});
	}
}

const Shop_general = async(res, obj, Shop, payload) => {
	try{
		MdFilter.readonly_Func(obj);

		if(!obj.code) obj.code = Shop.code;
		if(!obj.nome) obj.nome = Shop.nome;
		const errorInfo = MdFilter.Stint_Match_objs(StintShop, obj, ['code', 'nome']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();

		if(obj.code !== Shop.code || obj.nome !== Shop.nome) {
			const objSame = await ShopDB.findOne({
				_id: {$ne: Shop._id},
				Firm: payload.Firm,
				$or:[{'code': obj.code}, {'nome': obj.nome}],
			});
			if(objSame) return res.json({status: 400, message: '[server] 此店铺编号已被占用, 请查看'});
		}

		if((obj.is_main == 1 || obj.is_main === true || obj.is_main === 'true') && (Shop.is_main !== true)) {
			const ShopUpdMany = await ShopDB.updateMany({Firm: payload.Firm, is_main: true}, {is_main: false});
			obj.is_main = true;
			// const mainShop = await ShopDB.findOne({is_main: true});
			// if(mainShop) return res.json({status: 400, message: "[server] 只能有一个主店铺, 需要把主店铺关闭, 再开启此主店铺"})
		}

		if(obj.Cita && (obj.Cita != Shop.Cita)) {
			if(!MdFilter.is_ObjectId_Func(obj.Cita)) return res.json({status: 400, message: '[server] 城市数据需要为 _id 格式'});

			const index = MdFilter.indexArrObj_Func(Shop.serve_Citas, "Cita", obj.Cita);	// 查看服务区中 是否有此城市
			if(index < 0) return res.json({status: 400, message: '[server] 请先添加服务区'});

			const Cita = await CitaDB.findOne({_id: obj.Cita});
			if(!Cita) return res.json({status: 400, message: '[server] 没有找到此城市信息'});
		}

		if(obj.img_url && (obj.img_url != Shop.img_url) && Shop.img_url){
			await MdFiles.rmPicture(Shop.img_url);
		}

		obj.User_upd = payload._id;
		const _object = _.extend(Shop, obj);

		const objSave = await Shop.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/Shop_general", error);
		return res.json({status: 500, message: "[服务器错误: Shop_general]"});
	}
}

const Shop_serveCitaPost = async(res, obj, Shop) => {
	try{
		if(isNaN(obj.price_ship) || !obj.Cita || !MdFilter.is_ObjectId_Func(obj.Cita)) {
			return res.json({status: 400, message: "[server] 请正确传输 新的服务区参数"});
		}

		const index = MdFilter.indexArrObj_Func(Shop.serve_Citas, "Cita", obj.Cita);	// 查看服务区中 是否有此城市
		if(index >= 0) return res.json({status: 400, message: '[server] 此服务区已经被添加'});

		Shop.serve_Citas.push(obj);
		const objSave = await Shop.save();
		// k-e-l-i-n;
		const object = await ShopDB.findOne({_id: objSave._id})
			.populate({path: 'serve_Citas.Cita'});
		return res.json({status: 200, message: '成功添加新的服务区', data: {object}});
	} catch(error) {
		console.log("/b1/Shop_serveCitaPost", error);
		return res.json({status: 500, message: "[服务器错误: Shop_serveCitaPost]"});
	}
}
const Shop_serveCitaPut = async(res, obj, Shop) => {
	try{
		const price_ship = parseFloat(obj.price_ship);
		if(isNaN(price_ship)) return res.json({status: 400, message: '[server] 服务费必须为数字'});
		// 找到此服务城市
		let i=0;
		for(; i<Shop.serve_Citas.length; i++) {
			if(String(Shop.serve_Citas[i]._id) === obj._id) {
				Shop.serve_Citas[i].price_ship = price_ship;
				break;
			}
		}
		if(i === Shop.serve_Citas.length) return res.json({status: 400, message: '[server] 没有找到需要修改的服务区'});

		const objSave = await Shop.save();
		return res.json({status: 200, message: '成功修改服务区', data: {object: objSave}});
	} catch(error) {
		console.log("/b1/Shop_serveCitaPut", error);
		return res.json({status: 500, message: "[服务器错误: Shop_serveCitaPut]"});
	}
}
const Shop_serveCitaDelete = async(res, obj, Shop) => {
	try{
		if(!MdFilter.is_ObjectId_Func(obj.Cita)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		if(obj.Cita == String(Shop.Cita)) return res.json({status: 400, message: "[server] 不可删除所在城市服务区"})
		Shop.serve_Citas.splice(Shop.serve_Citas.findIndex(serve_Cita => String(serve_Cita.Cita) == obj.Cita), 1);

		const objSave = await Shop.save();
		return res.json({status: 200, message: '成功删除服务区', data: {object: objSave}});
	} catch(error) {
		console.log("/b1/Shop_serveCitaDelete", error);
		return res.json({status: 500, message: "[服务器错误: Shop_serveCitaDelete]"});
	}
}


















const dbShop = 'Shop';
exports.Shops = async(req, res) => {
	console.log("/b1/Shops");
	try {
		const dbs_res = await GetDB.dbs(obtFilterObj(req));
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Shops", error);
		return res.json({status: 500, message: "[服务器错误: Shops]"});
	}
}

exports.Shop = async(req, res) => {
	console.log("/b1/Shop");
	try {
		const db_res = await GetDB.db(obtFilterObj(req, req.params.id));
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Shop", error);
		return res.json({status: 500, message: "[服务器错误: Shop]"});
	}
}

const obtFilterObj = (req, id) => {
	const DB_filter =  {
		payload: req.payload,
		queryObj: req.query,

		objectDB: ShopDB,
		path_Callback: Shop_path_Func,
		dbName: dbShop,
	};
	if(id) DB_filter.id = id;

	return DB_filter;
}


const Shop_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	if(payload.role > ConfUser.role_set.manager) {
		pathObj.is_usable = 1;
	}
	if(payload.role >= ConfUser.role_set.boss) {
		pathObj.Shop = payload.Shop;
	}

	if(!queryObj) return;
	if(queryObj.is_main) {
		const is_main = (queryObj.is_main == 1 || queryObj.is_main === true || queryObj.is_main === 'true') ? 1 :  0;
		pathObj["is_main"] = {'$eq': is_main};
	}
	if(queryObj.is_boutique) {
		const is_boutique = (queryObj.is_boutique == 1 || queryObj.is_boutique === true || queryObj.is_boutique === 'true') ? 1 : 0;
		pathObj["is_boutique"] = {'$eq': is_boutique};
	}
	if(queryObj.serve_Citas) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.serve_Citas);
		pathObj["serve_Citas"] = { $elemMatch: {Cita: {$in: ids}}};
	}
	if(queryObj.Citas) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Citas);
		pathObj["Cita"] = {$in: ids};
	}
}