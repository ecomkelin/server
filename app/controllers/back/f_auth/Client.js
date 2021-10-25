const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const ClientDB = require('../../../models/auth/Client');
const _ = require('underscore');

exports.ClientPut = async(req, res) => {
	console.log("/b1/ClientPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Client的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};

		const Client = await ClientDB.findOne(pathObj);
		if(!Client) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		const obj = req.body.general;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		Client.is_usable = (obj.is_usable == '1' || obj.is_usable == 'true') ? true : false;
		if(obj.sort && !isNaN(parseInt(obj.sort))) Client.sort = parseInt(obj.sort);

		const objSave = await Client.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/ClientPut", error);
		return res.json({status: 500, message: "[服务器错误: ClientPut]"});
	}
}




const dbClient = 'Client';
exports.Clients = async(req, res) => {
	console.log("/b1/Clients");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: ClientDB,
			path_Callback: null,
			dbName: dbClient,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Clients", error);
		return res.json({status: 500, message: "[服务器错误: Clients]"});
	}
}

exports.Client = async(req, res) => {
	console.log("/b1/Client");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: ClientDB,
			path_Callback: null,
			dbName: dbClient,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Client", error);
		return res.json({status: 500, message: "[服务器错误: Client]"});
	}
}