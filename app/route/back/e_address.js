const MdFilter = require('../../middle/middleFilter');
const GetDB = require('../../controllers/_db/GetDB');

const StintNation = require('../../config/StintNation.js');
const StintArea = require('../../config/StintArea.js');
const StintCita = require('../../config/StintCita.js');
const MdFiles = require('../../middle/middleFiles');

const NationDB = require('../../models/address/Nation');
const AreaDB = require('../../models/address/Area');
const CitaDB = require('../../models/address/Cita');

const ShopDB = require('../../models/auth/Shop');

const MdAuth = require('../../middle/middleAuth');
const _ = require('underscore');

module.exports = (app) => {
	app.delete('/api/b1/Nation/:id', MdAuth.path_mger, NationDelete);
	app.put('/api/b1/Nation/:id', MdAuth.path_mger, NationPut);
	app.post('/api/b1/Nation', MdAuth.path_mger, NationPost);

	app.delete('/api/b1/Area/:id', MdAuth.path_mger, AreaDelete);
	app.put('/api/b1/Area/:id', MdAuth.path_mger, AreaPut);
	app.post('/api/b1/Area', MdAuth.path_mger, AreaPost);

	app.delete('/api/b1/Cita/:id', MdAuth.path_mger, CitaDelete);
	app.put('/api/b1/Cita/:id', MdAuth.path_mger, CitaPut);
	app.post('/api/b1/Cita', MdAuth.path_mger, CitaPost);
};

const NationPost = async(req, res) => {
	console.log('/b1/NationPost');
	try {
		const curUser = req.curUser;
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Nation", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		let errorInfo = null;
		if(!obj.code) return res.json({status: 400, message: '[server] 请输入国家代号'});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintNation.code);
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintNation.nome);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		const objSame = await NationDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}]});
		if(objSame) return res.json({status: 400, message: '[server] 国家代号或名称相同'});
		const _object = new NationDB(obj);
		const objSave = await _object.save();

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: NationPost]"});
	}
}
const NationPut = async(req, res) => {
	try {
		const curUser = req.curUser;
		const dbName = "Nation";
		return res.json({status: 100});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Nations]"});
	}
}
const NationDelete = async(req, res) => {
	try {
		const curUser = req.curUser;
		const dbName = "Nation";
		return res.json({status: 100});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Nations]"});
	}
}

const AreaPost = async(req, res) => {
	try {
		const curUser = req.curUser;
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Area", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		let errorInfo = null;
		if(!obj.code) return res.json({status: 400, message: '[server] 请输入大区代号'});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintArea.code);
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintArea.nome);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 请输入所属国家'});
		const Nation = await NationDB.findOne({_id: obj.Nation});
		if(!Nation) return res.json({status: 400, message: '[server] 没有找到您选择的大区信息'});

		const objSame = await AreaDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}]});
		if(objSame) return res.json({status: 400, message: '[server] 大区代号或名称相同'});
		const _object = new AreaDB(obj);
		const objSave = await _object.save();

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Areas]"});
	}
}
const AreaPut = async(req, res) => {
	try {
		const curUser = req.curUser;
		const dbName = "Area";
		return res.json({status: 100});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Areas]"});
	}
}
const AreaDelete = async(req, res) => {
	try {
		const curUser = req.curUser;
		const dbName = "Area";
		return res.json({status: 100});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Areas]"});
	}
}

const CitaPost = async(req, res) => {
	try {
		const curUser = req.curUser;
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Nation", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		let errorInfo = null;
		if(!obj.code) return res.json({status: 400, message: '[server] 请输入城市代号'});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintCita.code);
		if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintCita.nome);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(!MdFilter.is_ObjectId_Func(obj.Area)) return res.json({status: 400, message: '[server] 请输入所属大区'});
		const Area = await AreaDB.findOne({_id: obj.Area});
		if(!Area) return res.json({status: 400, message: '[server] 没有找到您选择的大区信息'});

		const objSame = await CitaDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}]});
		if(objSame) return res.json({status: 400, message: '[server] 城市代号或名称相同'});
		const _object = new CitaDB(obj);
		const objSave = await _object.save();

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Citas]"});
	}
}

const CitaPut = async(req, res) => {
	console.log('/b1/CitaPut');
	try {
		const curUser = req.curUser;

		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Cita = await CitaDB.findOne({_id: id});
		if(!Cita) return res.json({status: 400, message: "[server] 没有找到此城市信息, 请刷新重试"});

		let obj = req.body.general;
		if(!obj) obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Cita", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		let errorInfo = null;
		// (!errorInfo) && (obj.code) && (obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()) && (obj.code != Cita.code) 
		if(obj.code && (obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()) && (obj.code != Cita.code)) {
			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.code, StintCita.code);
			if(!errorInfo) {
				const objSame = await CitaDB.findOne({_id: {$ne: Cita._id}, code: obj.code, Firm: curUser.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 此城市编号已被占用, 请查看'});
			}
		}
		if(!errorInfo && obj.nome && (obj.nome != Cita.nome)) {
			if(!errorInfo) errorInfo = MdFilter.Stint_Match_Func(obj.nome, StintCita.nome);
			if(!errorInfo) {
				const objSame = await CitaDB.findOne({_id: {$ne: Cita._id}, nome: obj.nome, Firm: curUser.Firm});
				if(objSame) return res.json({status: 400, message: '[server] 此城市名称已被占用, 请查看'});
			}
		}
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(obj.Area && (obj.Area != Cita.Area)) {
			if(!MdFilter.is_ObjectId_Func(obj.Area)) return res.json({status: 400, message: '[server] 国家数据需要为 _id 格式'});
			const Area = await AreaDB.findOne({_id: obj.Area});
			if(!Area) return res.json({status: 400, message: '[server] 没有找到此大区信息'});
		}

		if(obj.img_url && (obj.img_url != Cita.img_url) && Cita.img_url && Cita.img_url.split("Cita").length > 1){
			await MdFiles.rmPicture(Cita.img_url);
		}

		obj.User_upd = curUser._id;
		const _object = _.extend(Cita, obj);

		const objSave = await _object.save();
		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Citas]"});
	}
}
const CitaDelete = async(req, res) => {
	try {
		const curUser = req.curUser;
		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Cita = await CitaDB.findOne({_id: id});
		if(!Cita) return res.json({status: 400, message: "[server] 没有找到此城市"});

		const Shop = await ShopDB.findOne({Cita: id});
		if(Shop) return res.json({status: 400, message: "[server] 请先删除城市中的商店"});

		if(Cita.img_url && Cita.img_url.split("Cita").length > 1) await MdFiles.rmPicture(Cita.img_url);
		const objDel = await CitaDB.deleteOne({_id: id});
		return res.status(200).json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log(error);
		return res.status(500).json({status: 500, message: "[服务器错误: Citas]"});
	}
}