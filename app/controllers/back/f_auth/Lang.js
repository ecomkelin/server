/*
	[语言]数据库 谨慎添加 删除. 容易添加 删除时要考虑到所有用语言的数据库
*/
const _ = require('underscore');

const LangDB = require('../../../models/auth/Lang');

exports.Langs = async(req, res) => {
	console.log("/b1/Langs");
	try{
		const payload = req.payload;
		const Langs = await LangDB.find({Firm: payload.Firm})
			.populate("langs.Lang")
			.sort({"sort": -1, "updAt": -1});
		// Langs.forEach((item) => {console.log("/b1/Langs", item); });
		// return res.render("./user/ower/lang/list", {title: "语言管理", Langs});
		return res.status(200).json({status: 200, data: {Langs}});
	} catch(error) {
		console.log("/b1/Langs", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Langs]"});
	}
}

exports.LangPost = async(req, res) => {
	console.log("/b1/LangPost");
	try{
		const payload = req.payload;
		const obj = req.body.obj;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
		obj.code = obj.code.replace(/^\s*/g,"").toUpperCase();
		if(obj.code.length !== 2) return res.json({status: 400, message: '[server] 语言编号为2位 如IT CN EN'});
		if(!obj.langs[0].nome) return res.json({status: 400, message: '[server] 没有填写语言名称'});
		obj.langs.forEach((lang) => {
			if(!lang.nome) lang.nome = '*';
		})
		const objSame = await LangDB.findOne({code: obj.code, Firm: payload.Firm});
		if(objSame) return res.json({status: 400, message: '[server] 语言编号相同'});
		const _object = new LangDB(obj);
		const objSave = await _object.save();
		const Langs = await LangDB.find({_id: {"$ne": objSave._id}, Firm: payload.Firm})
			.sort({"sort": -1, "updAt": -1});
		for(let i=0; i<Langs.length; i++) {
			const Lang = Langs[i];
			Lang.langs.push({Lang: objSave._id, nome: '*'});
			await Lang.save();
		}
		return res.status(200).json({status: 200, message: "[server] 创建新成功"});
	} catch(error) {
		console.log("/b1/LangPost", error);
		return res.status(500).json({status: 500, message: "[服务器错误: LangPost]"});
	}
}

exports.LangPut = async(req, res) => {
	console.log("/b1/LangPut");
	try{
		const payload = req.payload;
		const id = req.params.id;		// 所要更改的Lang的id

		const Lang = await LangDB.findOne({_id: id, Firm: payload.Firm});
		if(!Lang) return res.json({status: 400, message: "没有找到此语言信息, 请刷新重试"});

		const field = req.body.field;	// 要改变的 key
		let val = String(req.body.val).replace(/^\s*/g,"").toUpperCase();		// 数据的值
		
		if(field == "nome") {
			if(val.length < 1) val = '*';
			const lang = Lang.langs.find((item) => {
				return String(item._id) == String(req.body.subid);
			});
			lang.nome = val;
		} else {
			if(field == "code") {
				if(val.length < 2) return res.json({status: 400, message: "国家编号错误"});
				const objSame = await LangDB.findOne({code: val});
				if(objSame) return res.json({status: 400, message: "有相同的编号"});
			}
			Lang[field] = val;
		}

		const objSave = await Lang.save();
		return res.status(200).json({status: 200})
	} catch(error) {
		console.log("/b1/LangPut", error);
		return res.status(500).json({status: 500, message: error});
	}
}