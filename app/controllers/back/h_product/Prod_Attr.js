const GetDB = require('../../_db/GetDB');

const StintAttr = require('../../../config/StintAttr.js');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');

const ProdDB = require('../../../models/product/Prod');
const AttrDB = require('../../../models/product/internal/Attr');

const SkuDB = require('../../../models/product/Sku');

const _ = require('underscore');


exports.AttrPost = async(req, res) => {
	console.log("/b1/AttrPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const obj = req.body.obj;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		if(!MdFilter.is_ObjectId_Func(obj.Prod)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Prod = await ProdDB.findOne({_id: obj.Prod, Firm: payload.Firm}, {Attrs: 1});
		if(!Prod) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		const errorInfo = MdFilter.Stint_Match_objs(StintAttr, obj, ['nome']);
		if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
		obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase();

		const objSame = await AttrDB.findOne({Prod: obj.Prod, nome: obj.nome});
		if(objSame) return res.json({status: 400, message: "[server] 此产品已有此属性"});

		if(!obj.options || obj.options.length == 0) return res.json({status: 400, message: "[server] 请正确传输 新的商品属性值参数"});
		if(!(obj.options instanceof Array)) obj.options = MdFilter.getArrayFromString(obj.options);
		obj.options = MdFilter.Arr_toUpper_Func(obj.options);
		obj.options = MdFilter.setArrays_Func(obj.options);

		obj.Firm = payload.Firm;
		obj.User_crt = payload._id;
		if(obj.sort) obj.sort = parseInt(obj.sort);

		const _object = new AttrDB(obj);
		const objSave = await _object.save();

		Prod.Attrs.push(objSave._id);
		const ProdSave = await Prod.save();
		return res.json({status: 200, message: '成功添加新的商品属性', data: {object: objSave}});
	} catch(error) {
		console.log("/b1/AttrPost", error);
		return res.json({status: 500, message: "[服务器错误: AttrPost]"});
	}
}




exports.AttrDelete = async(req, res) => {
	console.log("/b1/AttrDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Attr = await AttrDB.findOne({_id: id, Firm: payload.Firm}, {nome: 1, Prod:1});
		if(!Attr) return res.json({status: 400, message: "[server] 没有找到此店铺信息, 请刷新重试"});

		const Sku = await SkuDB.findOne({Prod: Attr.Prod, attrs: { $elemMatch: {nome: Attr.nome}}});
		if(Sku) return res.json({status: 400, message: "[server] 请先删除商品中对应该属性的Product"});

		const Prod = await ProdDB.findOne({_id: Attr.Prod, Firm: payload.Firm});
		if(!Prod) return res.json({status: 400, message: "[server] 没有找到对应的 商品"});

		const index = MdFilter.indexArr_Func(Prod.Attrs, id);
		Prod.Attrs.splice(index, 1);
		const objSave = await Prod.save();
		if(!objSave) return res.json({status: 400, message: "[server] 对应的 商品 保存错误"});

		const objDel = await AttrDB.deleteOne({_id: id});
		return res.json({status: 200, message: '成功删除商品属性', data: {object: objSave}});
	} catch(error) {
		console.log("/b1/AttrDelete", error);
		return res.json({status: 500, message: "[服务器错误: AttrDelete]"});
	}
}


exports.AttrPut = async(req, res) => {
	console.log("/b1/AttrPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const Attr = await AttrDB.findOne({_id: id, Firm: payload.Firm});
		if(!Attr) return res.json({status: 400, message: "[server] 没有找到此产品属性"});
		
		if(req.body.general) {
			Attr_general(res, req.body.general, Attr);
		} else if(req.body.optionDelete) {
			Attr_optionDelete(res, req.body.optionDelete, Attr);
		} else if(req.body.optionPuts) {
			Attr_optionPut(res, req.body.optionPuts, Attr);
		} else if(req.body.optionPost) {
			Attr_optionPost(res, req.body.optionPost, Attr);
		} else {
			return res.json({status: 400, message: '请检查传递的参数是否正确'});
		}

	} catch(error) {
		console.log("/b1/AttrPut", error);
		return res.json({status: 500, message: "[服务器错误: AttrPut]"});
	}
}
const Attr_optionPost = async(res, obj, Attr) => {
	console.log("/Attr_optionPost")
	try{
		if(!obj.options) return res.json({status: 400, message: '[server] 请传递 options 属性值'});
		if(!(obj.options instanceof Array)) obj.options = MdFilter.getArrayFromString(obj.options);
		obj.options = MdFilter.Arr_toUpper_Func(obj.options);
		if(!Attr.options) Attr.options = [];
		for(let i=0; i<obj.options.length; i++) {
			let option = obj.options[i];
			let j=0;
			for(; j<Attr.options.length; j++) {
				if(Attr.options.includes(option)) break;
			}
			if(j === Attr.options.length) Attr.options.push(String(option));
		}
		const object = await Attr.save();
		return res.json({status: 200, message: '成功修改商品属性', data: {object: Attr}});
	} catch(error) {
		console.log("/b1/Attr_optionPost", error);
		return res.json({status: 500, message: "[服务器错误: Attr_optionPost]"});
	}
}
const Attr_optionPut = async(res, objs, Attr) => {
	console.log("/Attr_optionPut")
	try{
		for(let i=0; i<objs.length; i++) {
			const obj = objs[i];

			if(!obj.option) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});
			// 新的 option 为 optionPut
			if(!obj.optionPut) obj.optionPut = obj.option;
			obj.option = obj.option.toUpperCase();
			obj.optionPut = obj.optionPut.toUpperCase();

			const index = MdFilter.indexArr_Func(Attr.options, obj.option);	// 获取原属性值的位置
			if(index < 0) return res.json({status: 400, message: "[server] 要修改的产品属性值 不存在"});

			const options = [...Attr.options];

			if(obj.sort) {
				obj.sort = parseInt(obj.sort);
			} else {
				obj.sort = index;
			}
			if(isNaN(obj.sort)) obj.sort = index;

			if(obj.sort !== index) {
				options.splice(index, 1);
				options.splice(obj.sort, 0, obj.optionPut);
			} else {
				options[index] = obj.optionPut;
			}
			if(obj.optionPut != obj.option) {
				const option_UpdMany = await SkuDB.updateMany(
					{Prod: Attr.Prod, attrs: { $elemMatch: {nome: Attr.nome, option: obj.option}}},
					{ $set: { "attrs.$[elem].option" : obj.optionPut } },
					{ arrayFilters: [ { "elem.option": obj.option } ], "multi": true }
				)
			}
			Attr.options = options
		}
		// await AttrDB.updateOne({_id: Attr._id}, { options });
		const object = await Attr.save();
		return res.json({status: 200, message: '成功修改商品属性', data: {object}});
	} catch(error) {
		console.log("/b1/Attr_optionPut", error);
		return res.json({status: 500, message: "[服务器错误: Attr_optionPut]"});
	}
}
const Attr_optionDelete = async(res, obj, Attr) => {
	console.log("/Attr_optionDelete")
	try{
		if(!obj.options || obj.options.length == 0) return res.json({status: 400, message: "[server] 请正确传输 请传递产品属性值"});
		if(!(obj.options instanceof Array)) obj.options = MdFilter.getArrayFromString(obj.options);
		obj.options = MdFilter.Arr_toUpper_Func(obj.options);
		obj.options = MdFilter.setArrays_Func(obj.options);

		if(obj.options.length == Attr.options.length)  return res.json({status: 400, message: "[server] 如果需要全部删除, 请删除属性"});

		const Sku = await SkuDB.findOne({
			Prod: Attr.Prod,
			attrs: { $elemMatch: {nome: Attr.nome, option: {$in: obj.options}}}
		});

		if(Sku) return res.json({status: 400, message: `[server] 删除属性值时[${String(obj.options)}]中有值被[${Sku._id}]Sku在用`});

		for(let i=0; i<obj.options.length; i++) {
			const option = obj.options[i];
			const index = MdFilter.indexArr_Func(Attr.options, option);
			if(index >= 0) {
				Attr.options.splice(index, 1);
			}
		}
		const object = await Attr.save();
		return res.json({status: 200, message: '成功修改商品属性', data: {object}});
	} catch(error) {
		console.log("/b1/Attr_optionDelete", error);
		return res.json({status: 500, message: "[服务器错误: Attr_optionDelete]"});
	}
}
const Attr_general = async(res, obj, Attr) => {
	console.log("/Attr_general")
	try{
		if(obj.nome) {
			obj.nome = obj.nome.replace(/^\s*/g,"").toUpperCase();
			if(obj.nome !== Attr.nome) {
				const errorInfo = MdFilter.Stint_Match_objs(StintAttr, obj, ['nome']);
				if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

				const objSame = await AttrDB.findOne({_id: {$ne: Attr._id}, Prod: obj.Prod, nome: obj.nome});
				if(objSame) return res.json({status: 400, message: "[server] 此产品已有此属性"});

				const Sku_Upd_nome = await SkuDB.updateMany(
					{Prod: Attr.Prod, attrs: { $elemMatch: {nome: Attr.nome}}},
					{ $set: { "attrs.$[elem].nome" : obj.nome } },
					{ arrayFilters: [ { "elem.nome": Attr.nome } ] }
				);

				Attr.nome = obj.nome;
			}
		}
		if(obj.sort && !isNaN(parseInt(obj.sort))) {
			Attr.sort = parseInt(obj.sort);
		}
		const object = await Attr.save();
		return res.json({status: 200, message: '成功修改商品属性', data: {object}});
	} catch(error) {
		console.log("/b1/Attr_general", error);
		return res.json({status: 500, message: "[服务器错误: Attr_general]"});
	}
}



















const Attr_path_Func = (pathObj, payload, queryObj) => {
	if(payload) {
		pathObj.Firm = payload.Firm;
	}
	if(!queryObj) return;
	pathObj.Prod = queryObj.Prod;
}
const dbAttr = 'Attr'

exports.Attrs = async(req, res) => {
	console.log("/b1/Attrs");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: AttrDB,
			path_Callback: Attr_path_Func,
			dbName: dbAttr,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Attrs", error);
		return res.json({status: 500, message: "[服务器错误: Attrs]"});
	}
}


exports.Attr = async(req, res) => {
	console.log("/b1/Attr");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: AttrDB,
			path_Callback: Attr_path_Func,
			dbName: dbAttr,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Attr", error);
		return res.json({status: 500, message: "[服务器错误: Attr]"});
	}
}