const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const BrandDB = require('../../../models/complement/Brand');

const vBrand_path_Func = (pathObj, curClient, queryObj) => {
	pathObj.is_usable = 1;

	if(!queryObj) return;
	if(queryObj.Nations) {
		const ids = MdFilter.getArray_ObjectId_Func(queryObj.Nations);
		pathObj["Nation"] = {$in: ids};
	}
}


const dbBrand = 'Brand';
exports.vBrands = async(req, res) => {
	console.log("/v1/Brands");
	try {
		const curClient = req.curClient || req.ip;
		const GetDB_Filter = {
			Identity: curClient,
			queryObj: req.query,
			objectDB: BrandDB,
			path_Callback: vBrand_path_Func,
			dbName: dbBrand,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/v1/Brands", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vBrands]"});
	}
}


exports.vBrand = async(req, res) => {
	console.log("/v1/Brand");
	try {
		const curClient = req.curClient;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: curClient,
			queryObj: req.query,
			objectDB: BrandDB,
			path_Callback: vBrand_path_Func,
			dbName: dbBrand,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/v1/Brand", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vBrand]"});
	}
}