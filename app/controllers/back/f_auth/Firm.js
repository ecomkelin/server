const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const StintFirm = require('../../../config/StintFirm.js');
const MdFilter = require('../../../middle/middleFilter');
const MdFiles = require('../../../middle/middleFiles');
const MdSafe = require('../../../middle/middleSafe');

const FirmDB = require('../../../models/auth/Firm');

const CitaDB = require('../../../models/address/Cita');

const ProdDB = require('../../../models/product/Prod');
const UserDB = require('../../../models/auth/User');

const _ = require('underscore');



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
		} else {
			// 判断是否用上传文件的形式 传递了数据
			const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Firm", field: "img_url"});
			if(!obj) return res.json({status: 400, message: "[server] 参数错误"});
			Firm_general(res, obj, Firm, payload);
		}
	} catch(error) {
		console.log("/b1/FirmPut", error);
		return res.json({status: 500, message: "[服务器错误: FirmPut]"});
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