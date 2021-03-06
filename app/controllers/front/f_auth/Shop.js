const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const ShopDB = require('../../../models/auth/Shop');

const vShop_path_Func = (pathObj, payload, queryObj) => {
	pathObj.is_usable = 1;

	if(!queryObj) return;
	if(queryObj.is_boutique) {
		(queryObj.is_boutique == 0 || queryObj.is_boutique == "false") ? (is_boutique = 0) : (is_boutique = 1)
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

const dbShop = 'Shop';
exports.vShops = async(req, res) => {
	console.log("/v1/Shops");
	try {
		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			payload,
			queryObj: req.query,
			objectDB: ShopDB,
			path_Callback: vShop_path_Func,
			dbName: dbShop,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/v1/Shops", error);
		return res.json({status: 500, message: "[服务器错误: vShops]"});
	}
}

exports.vShop = async(req, res) => {
	console.log("/v1/Shop");
	try {
		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			id: req.params.id,
			payload,
			queryObj: req.query,
			objectDB: ShopDB,
			path_Callback: vShop_path_Func,
			dbName: dbShop,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/v1/Shop", error);
		return res.json({status: 500, message: "[服务器错误: vShop]"});
	}
}