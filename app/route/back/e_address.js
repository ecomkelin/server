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
		const payload = req.payload;
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Nation", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		const errorInfo = MdFilter.Stint_Match_objs(StintNation, obj, ['code', 'nome']);
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase();
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		const objSame = await NationDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}]});
		if(objSame) return res.json({status: 400, message: '[server] 国家代号或名称相同'});
		const _object = new NationDB(obj);
		const objSave = await _object.save();

		return res.json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: NationPost]"});
	}
}
const NationPut = async(req, res) => {
	try {
		const payload = req.payload;

		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Nation = await NationDB.findOne({_id: id});
		if(!Nation) return res.json({status: 400, message: "[server] 没有找到此城市信息, 请刷新重试"});

		let obj = req.body.general;
		if(!obj) obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Nation", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		if(!obj.code) obj.code = Nation.code;
		if(!obj.nome) obj.nome = Nation.nome;
		const errorInfo = MdFilter.Stint_Match_objs(StintNation, obj, ['code', 'nome']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase()
		obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase()
		if(obj.code !== Nation.code || obj.nome !== Nation.nome) {
			const objSame = await NationDB.findOne({_id: {$ne: Nation._id}, $or: [{code: obj.code}, {nome: obj.nome}]});
			if(objSame) return res.json({status: 400, message: '[server] 此城市编号已被占用, 请查看'});
		}

		if(obj.img_url && (obj.img_url != Nation.img_url) && Nation.img_url){
			await MdFiles.rmPicture(Nation.img_url);
		}

		obj.User_upd = payload._id;
		const _object = _.extend(Nation, obj);

		const objSave = await _object.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Nations]"});
	}
}
const NationDelete = async(req, res) => {
	try {
		const payload = req.payload;
		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Nation = await NationDB.findOne({_id: id});
		if(!Nation) return res.json({status: 400, message: "[server] 没有找到此城市"});

		const Area = await AreaDB.findOne({Nation: id});
		if(Area) return res.json({status: 400, message: "[server] 请先删除城市中的商店"});

		if(Nation.img_url) await MdFiles.rmPicture(Nation.img_url);
		const objDel = await NationDB.deleteOne({_id: id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Nations]"});
	}
}




















const AreaPost = async(req, res) => {
	try {
		const payload = req.payload;
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Area", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		const errorInfo = MdFilter.Stint_Match_objs(StintArea, obj, ['code', 'nome']);
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase();
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 请输入所属国家'});
		const Nation = await NationDB.findOne({_id: obj.Nation});
		if(!Nation) return res.json({status: 400, message: '[server] 没有找到您选择的大区信息'});

		const objSame = await AreaDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}]});
		if(objSame) return res.json({status: 400, message: '[server] 大区代号或名称相同'});
		const _object = new AreaDB(obj);
		const objSave = await _object.save();

		return res.json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Areas]"});
	}
}
const AreaPut = async(req, res) => {
	try {
		const payload = req.payload;

		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Area = await AreaDB.findOne({_id: id});
		if(!Area) return res.json({status: 400, message: "[server] 没有找到此城市信息, 请刷新重试"});

		let obj = req.body.general;
		if(!obj) obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Area", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		if(!obj.code) obj.code = Area.code;
		if(!obj.nome) obj.nome = Area.nome;
		const errorInfo = MdFilter.Stint_Match_objs(StintArea, obj, ['code', 'nome']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase();
		if(obj.code !== Area.code || obj.nome !== Area.nome) {
			const objSame = await AreaDB.findOne({_id: {$ne: Area._id}, $or: [{code: obj.code}, {nome: obj.nome}]});
			if(objSame) return res.json({status: 400, message: '[server] 此城市编号已被占用, 请查看'});
		}

		if(obj.Nation && (obj.Nation != Area.Nation)) {
			if(!MdFilter.is_ObjectId_Func(obj.Nation)) return res.json({status: 400, message: '[server] 国家数据需要为 _id 格式'});
			const Nation = await NationDB.findOne({_id: obj.Nation});
			if(!Nation) return res.json({status: 400, message: '[server] 没有找到此国家信息'});
		}

		if(obj.img_url && (obj.img_url != Area.img_url) && Area.img_url){
			await MdFiles.rmPicture(Area.img_url);
		}

		obj.User_upd = payload._id;
		const _object = _.extend(Area, obj);

		const objSave = await _object.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Areas]"});
	}
}
const AreaDelete = async(req, res) => {
	try {
		const payload = req.payload;
		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Area = await AreaDB.findOne({_id: id});
		if(!Area) return res.json({status: 400, message: "[server] 没有找到此城市"});

		const Cita = await CitaDB.findOne({Area: id});
		if(Cita) return res.json({status: 400, message: "[server] 请先删除城市中的商店"});

		if(Area.img_url) await MdFiles.rmPicture(Area.img_url);
		const objDel = await AreaDB.deleteOne({_id: id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Areas]"});
	}
}
























const CitaPost = async(req, res) => {
	console.log('/b1/CitaPost');
	try {
		const payload = req.payload;
		const obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Cita", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		const errorInfo = MdFilter.Stint_Match_objs(StintCita, obj, ['code', 'nome']);
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase();
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

		if(!MdFilter.is_ObjectId_Func(obj.Area)) return res.json({status: 400, message: '[server] 请输入所属大区'});
		const Area = await AreaDB.findOne({_id: obj.Area});
		if(!Area) return res.json({status: 400, message: '[server] 没有找到您选择的大区信息'});

		const objSame = await CitaDB.findOne({$or:[{'code': obj.code}, {'nome': obj.nome}]});
		if(objSame) return res.json({status: 400, message: '[server] 城市代号或名称相同'});
		const _object = new CitaDB(obj);
		const objSave = await _object.save();

		return res.json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Citas]"});
	}
}

const CitaPut = async(req, res) => {
	console.log('/b1/CitaPut');
	try {
		const payload = req.payload;

		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Cita = await CitaDB.findOne({_id: id});
		if(!Cita) return res.json({status: 400, message: "[server] 没有找到此城市信息, 请刷新重试"});

		let obj = req.body.general;
		if(!obj) obj = await MdFiles.mkPicture_prom(req, {img_Dir: "/Cita", field: "img_url"});
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		if(!obj.code) obj.code = Cita.code;
		if(!obj.nome) obj.nome = Cita.nome;
		const errorInfo = MdFilter.Stint_Match_objs(StintCita, obj, ['code', 'nome']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();

		if(obj.code !== Cita.code || obj.nome !== Cita.nome) {
			const objSame = await CitaDB.findOne({_id: {$ne: Cita._id}, $or: [{code: obj.code},{nome: obj.nome}]});
			if(objSame) return res.json({status: 400, message: '[server] 此城市编号已被占用, 请查看'});
		}

		if(obj.Area && (obj.Area != Cita.Area)) {
			if(!MdFilter.is_ObjectId_Func(obj.Area)) return res.json({status: 400, message: '[server] 大区数据需要为 _id 格式'});
			const Area = await AreaDB.findOne({_id: obj.Area});
			if(!Area) return res.json({status: 400, message: '[server] 没有找到此大区信息'});
		}

		if(obj.img_url && (obj.img_url != Cita.img_url) && Cita.img_url){
			await MdFiles.rmPicture(Cita.img_url);
		}

		obj.User_upd = payload._id;
		const _object = _.extend(Cita, obj);

		const objSave = await _object.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Citas]"});
	}
}
const CitaDelete = async(req, res) => {
	try {
		const payload = req.payload;
		const id = req.params.id;		// 所要更改的Cita的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Cita = await CitaDB.findOne({_id: id});
		if(!Cita) return res.json({status: 400, message: "[server] 没有找到此城市"});

		const Shop = await ShopDB.findOne({Cita: id});
		if(Shop) return res.json({status: 400, message: "[server] 请先删除城市中的商店"});

		if(Cita.img_url) await MdFiles.rmPicture(Cita.img_url);
		const objDel = await CitaDB.deleteOne({_id: id});
		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: Citas]"});
	}
}