const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const ProdDB = require('../../../models/product/Prod');

const _ = require('underscore');

const vProd_path_Func = (pathObj, payload, queryObj) => {
	// pathObj.is_usable = 1;

	if(!queryObj) return;
	if(queryObj.Shops) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Shops);
		pathObj.Shop = {$in: ids};
	}
	if(queryObj.Brands) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Brands);
		pathObj["Brand"] = {$in: ids};
	}
	if(queryObj.Nations) {
		let ids = MdFilter.getArray_ObjectId_Func(queryObj.Nations);
		pathObj["Nation"] = {$in: ids};
	}
	if(queryObj.Categs) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Categs);
		pathObj["Categ"] = {$in: ids};
	}
}


const dbProd = 'Prod';
exports.vProds = async(req, res) => {
	console.log("/v1/Prods");
	try {
		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			Identity: payload,
			queryObj: req.query,
			objectDB: ProdDB,
			path_Callback: vProd_path_Func,
			dbName: dbProd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		// console.log('prods', dbs_res.data.objects[0])
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/v1/Prods", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vProds]"});
	}
}

exports.vProd = async(req, res) => {
	console.log("/v1/Prod");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: payload,
			queryObj: req.query,
			objectDB: ProdDB,
			path_Callback: vProd_path_Func,
			dbName: dbProd,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/v1/Prod", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vProd]"});
	}
}