const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const BindDB = require('../../../models/auth/Bind');

const _ = require('underscore');

exports.BindPut = async(req, res) => {
	console.log("/b1/BindPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Bind的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};

		const Bind = await BindDB.findOne(pathObj);
		if(!Bind) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		const obj = req.body.obj;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		MdFilter.readonly_Func(obj);

		const _object = _.extend(Bind, obj);

		const objSave = await _object.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/BindPut", error);
		return res.json({status: 500, message: "[服务器错误: BindPut]"});
	}
}

exports.BindDelete = async(req, res) => {
	console.log("/b1/BindDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Bind的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};

		const Bind = await BindDB.findOne(pathObj);
		if(!Bind) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		const objDel = await BindDB.deleteOne({_id: Bind._id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/BindDelete", error);
		return res.json({status: 500, message: "[服务器错误: BindDelete]"});
	}
}







const dbBind = "Bind";
const Bind_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	if(!queryObj) return;
}

exports.Binds = async(req, res) => {
	console.log("/b1/Binds");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: BindDB,
			path_Callback: Bind_path_Func,
			dbName: dbBind,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Binds", error);
		return res.json({status: 500, message: "[服务器错误: Binds]"});
	}
}

exports.Bind = async(req, res) => {
	console.log("/b1/Bind");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: BindDB,
			path_Callback: Bind_path_Func,
			dbName: dbBind,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Bind", error);
		return res.json({status: 500, message: "[服务器错误: Bind]"});
	}
}