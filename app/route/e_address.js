const MdFilter = require('../middle/middleFilter');
const GetDB = require('../controllers/_db/GetDB');

const NationDB = require('../models/address/Nation');
const AreaDB = require('../models/address/Area');
const CitaDB = require('../models/address/Cita');

module.exports = (app) => {
	app.get('/api/b1/Nations', Nations);
	app.get('/api/b1/Areas', Areas);
	app.get('/api/b1/Citas', Citas);

	app.get('/api/v1/Nations', Nations);
	app.get('/api/v1/Areas', Areas);
	app.get('/api/v1/Citas', Citas);
};

const Nations_path_Func = (pathObj, Identity, queryObj) => {
	if(!Identity || !Identity.role) pathObj.is_usable = 1;
}

const Nations = async(req, res) => {
	try {
		const Identity = req.payload || req.curUser || req.ip;
		const dbNation = 'Nation';
		const GetDB_Filter = {
			Identity: Identity,
			queryObj: req.query,
			objectDB: NationDB,
			path_Callback: Nations_path_Func,
			dbName: dbNation,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Nations]"});
	}
}


const Areas_path_Func = (pathObj, Identity, queryObj) => {
	if(MdFilter.is_ObjectId_Func(queryObj.Nation)) pathObj["Nation"] = {'$eq': queryObj.Nation};
	if(!Identity || !Identity.role) pathObj.is_usable = 1;
}
const Areas = async(req, res) => {
	try {
		const Identity = req.payload || req.curUser || req.ip;
		const dbArea = 'Area';
		const GetDB_Filter = {
			Identity: Identity,
			queryObj: req.query,
			objectDB: AreaDB,
			path_Callback: Areas_path_Func,
			dbName: dbArea,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Areas]"});
	}
}


const Citas_path_Func = (pathObj, Identity, queryObj) => {
	if(MdFilter.is_ObjectId_Func(queryObj.Area)) pathObj["Area"] = {'$eq': queryObj.Area};
	if(!Identity || !Identity.role) pathObj.is_usable = 1;
}
const Citas = async(req, res) => {
	try {
		const Identity = req.payload || req.curUser || req.ip;
		const dbCita = 'Cita';
		const GetDB_Filter = {
			Identity: Identity,
			queryObj: req.query,
			objectDB: CitaDB,
			path_Callback: Citas_path_Func,
			dbName: dbCita,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Citas]"});
	}
}