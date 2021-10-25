const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');

const CategDB = require('../../../models/complement/Categ');

const vCategs_path_Func = (pathObj, payload, queryObj) => {
	pathObj.is_usable = 1;

	if(!queryObj) return;
	if(MdFilter.is_ObjectId_Func(queryObj.Categ_far)) {
		pathObj["Categ_far"] = queryObj.Categ_far;
	} else {
		pathObj.level = 1;
	}
}
const vCateg_path_Func = (pathObj, payload, queryObj) => {
	pathObj.is_usable = 1;
}

const dbCateg = 'Categ';
exports.vCategs = async(req, res) => {
	console.log("/v1/Categs");
	try {
		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: CategDB,
			path_Callback: vCategs_path_Func,
			dbName: dbCateg,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/v1/Categs", error);
		return res.json({status: 500, message: "[服务器错误: vCategs]"});
	}
}

exports.vCateg = async(req, res) => {
	console.log("/v1/Categ");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: CategDB,
			path_Callback: vCategs_path_Func,
			dbName: dbCateg,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/v1/Categ", error);
		return res.json({status: 500, message: "[服务器错误: vCateg]"});
	}
}