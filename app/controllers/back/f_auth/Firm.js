const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const MdFilter = require('../../../middle/middleFilter');

const MdSafe = require('../../../middle/middleSafe');

const FirmDB = require('../../../models/auth/Firm');
const ShopDB = require('../../../models/auth/Shop');


exports.FirmPut = async(req, res) => {
	console.log("/b1/FirmPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const pathObj = {_id: payload.Firm};

		const Firm = await FirmDB.findOne(pathObj);
		if(!Firm) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		if(req.body.general) {
			Firm_general(res, req.body.general, Firm, payload);
		} else if(req.body.mainShop) {
			Firm_mainShop(res, req.body.mainShop, Firm, payload);
		} {
			return res.json({status: 400, message: "[server] 请传递 general 参数"});
		}
	} catch(error) {
		console.log("/b1/FirmPut", error);
		return res.json({status: 500, message: "[服务器错误: FirmPut]"});
	}
}
const Firm_mainShop = async(res, obj, Firm, payload) => {
	try {
		const ShopId = obj.ShopId;
		if(!MdFilter.is_ObjectId_Func(ShopId)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Shop = await ShopDB.findOne({_id: ShopId, Firm: Firm._id});
		if(!Shop) return res.json({status: 400, message: "[server] 没有找到店铺信息"});

		const ShopUpdMany = await Shop.updateMany({Firm: Firm._id, is_main: true}, {is_main: false});
		Shop.is_main = true;
		const mainShopSave = await Shop.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: Firm}});
	} catch(error) {
		console.log("/b1/Firm_mainShop", error);
		return res.json({status: 500, message: "[服务器错误: Firm_mainShop]"});
	}
}
const Firm_general = async(res, obj, Firm, payload) => {
	try{
		if(obj.nome) Firm.nome = obj.nome;
		if(obj.resp) Firm.resp = obj.resp;
		if(obj.tel) Firm.tel = obj.tel;
		if(obj.addr) Firm.addr = obj.addr;

		const objSave = await Firm.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/Firm_general", error);
		return res.json({status: 500, message: "[服务器错误: Firm_general]"});
	}
}




const dbFirm = 'Firm';

exports.Firm = async(req, res) => {
	console.log("/b1/Firm");
	try {
		const db_res = await GetDB.db(obtFilterObj(req, req.params.id));
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Firm", error);
		return res.json({status: 500, message: "[服务器错误: Firm]"});
	}
}

const obtFilterObj = (req, id) => {
	const DB_filter =  {
		payload: req.payload,
		queryObj: req.query,

		objectDB: FirmDB,
		path_Callback: Firm_path_Func,
		dbName: dbFirm,
	};
	if(id) DB_filter.id = id;

	return DB_filter;
}


const Firm_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	if(payload.role > ConfUser.role_set.manager) {
		pathObj.is_usable = 1;
	}

	if(!queryObj) return;
}