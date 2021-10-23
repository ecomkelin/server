const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');

const SkuDB = require('../../../models/product/Sku');

const _ = require('underscore');

const vSku_path_Func = (pathObj, payload, queryObj) => {
	pathObj.is_usable = 1;

	if(!queryObj) return;
	pathObj.Prod = queryObj.Prod;
}

const dbSku = 'Sku';
exports.vSkus = async(req, res) => {
	console.log("/v1/Skus");
	try {
		if(!MdFilter.is_ObjectId_Func(req.query.Prod)) return res.json({status: 400, message: "[server] 请告知服务器 查看哪个产品的Product"});

		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: SkuDB,
			path_Callback: vSku_path_Func,
			dbName: dbSku,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/v1/Skus", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vSkus]"});
	}
}

exports.vSku = async(req, res) => {
	console.log("/v1/Sku");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: SkuDB,
			path_Callback: vSku_path_Func,
			dbName: dbSku,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/v1/Sku", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vSku]"});
	}
}