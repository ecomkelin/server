const GetDB = require('../../_db/GetDB');

const ConfUser = require('../../../config/ConfUser.js');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');

const ProdDB = require('../../../models/product/Prod');
const SkuDB = require('../../../models/product/Sku');
const OrderSkuDB = require('../../../models/order/OrderSku');

const _ = require('underscore');


const setAttrs_Func = (attrs) => {	// 设置 Sku.attrs 中的nome无重复  attr.nome 和 attr.option 为大写
	if(!attrs) return false;
	const nomes = [];
	const temps = [];
	for(let i=0; i<attrs.length; i++) {
		const attr = attrs[i];
		if(!attr.option || attr.option == "null" || attr.option == "" || attr.option == "0") continue;
		attr.nome = attr.nome.toUpperCase();
		attr.option = attr.option.toUpperCase();
		if(!nomes.includes(attr.nome)) temps.push(attr);
		nomes.push(attr.nome);
	}
	return temps;
}
const compareAttrs_Func = (temps, attrs) => {	// 查看 两个 attrs 是否相同
	if(temps.length != attrs.length) return false;
	const tmps = [];
	for(let i=0; i<temps.length; i++) {
		const temp = temps[i];
		for(let j=0; j<attrs.length; j++) {
			const attr = attrs[j];
			if((attr.nome == temp.nome) && (attr.option == temp.option)) {
				tmps.push({nome: temp.nome, option: temp.option});
				break;
			}
		}
	}
	return (tmps.length == temps.length) ? true : false ;
}

const includes_attrs_Func = (Attrs, attrs) => {	// 判断 Attrs 中是否包含所有的 attrs
	if(!Attrs || Attrs.length == 0 || !attrs || attrs.length == 0) return false;
	for(let i=0; i<attrs.length; i++) {
		const attr = attrs[i];
		if(!attr.nome || !attr.option) return false;
		const nomes = Attrs.map(item => { return item.nome});
		if(!nomes.includes(attr.nome)) return false;
		const options = Attrs.find(item => { return item.nome == attr.nome}).options;
		if(!options.includes(attr.option)) return false;
	}
	return true;
}

exports.SkuPost = async(req, res) => {
	console.log("/b1/SkuPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		let obj = req.body.obj;
		if(!obj) return res.json({status: 400, message: '[server] 请输入 obj 参数'});
		if(!MdFilter.is_ObjectId_Func(obj.Prod)) return res.json({status: 400, message: '[server] 所属商品 _id'});
		const Prod = await ProdDB.findOne({_id: obj.Prod, Firm: payload.Firm})
			.populate([{path: "Skus"}, {path: "Attrs", select: "nome options"}]);
		if(!Prod) return res.json({status: 400, message: '[server] 没有找到同步产品信息'});

		if(!obj.attrs || obj.attrs.length == 0) return res.json({status: 400, message: '[server] 请输入Product的属性值 '});
		obj.attrs = setAttrs_Func(obj.attrs);
		if(!includes_attrs_Func(Prod.Attrs, obj.attrs)) return res.json({status: 400, message: '[server] 商品中没有此属性'});

		const Skus = Prod.Skus;
		let iPt = 0;
		let Sku_def = null;
		for(; iPt<Skus.length; iPt++) {
			if(!Skus[iPt].attrs || Skus[iPt].attrs.length == 0) {
				Sku_def = Skus[iPt]
				continue;
			}
			if(compareAttrs_Func(obj.attrs, Skus[iPt].attrs)) break;
		}
		if(iPt != Skus.length) return res.json({status: 400, message: '[server] 已经有此属性 '});

		if(!Sku_def) return res.json({status: 400, message: '[server] 没有找到此产品的默认值 '});

		obj.Pd = Sku_def.Pd;
		obj.Firm = Sku_def.Firm;
		obj.Shop = Sku_def.Shop;

		obj.price_regular = isNaN(parseFloat(obj.price_regular)) ? Sku_def.price_regular : parseFloat(obj.price_regular);
		obj.price_sale = isNaN(parseInt(obj.price_sale)) ? Sku_def.price_sale : parseFloat(obj.price_sale);
		obj.limit_quantity = isNaN(parseInt(obj.limit_quantity)) ? Sku_def.limit_quantity : parseInt(obj.limit_quantity);

		if(obj.is_controlStock == 1 || obj.is_controlStock == "true") {
			obj.is_controlStock = true;
		} else if(obj.is_controlStock == 0 || obj.is_controlStock == "false") {
			obj.is_controlStock = false;
		} else {
			obj.is_controlStock = Sku_def.is_controlStock;
		}
		obj.quantity = (obj.quantity) ? parseInt(obj.quantity) : Sku_def.quantity;
		obj.quantity_alert = (obj.quantity_alert) ? parseInt(obj.quantity_alert) : Sku_def.quantity_alert;

		if(obj.allow_backorder == 1 || obj.allow_backorder == "true") {
			obj.allow_backorder = true;
		} else if(obj.allow_backorder == 0 || obj.allow_backorder == "false") {
			obj.allow_backorder = false;
		} else {
			obj.allow_backorder = Sku_def.allow_backorder;
		}

		obj.User_crt = payload._id;
		const _object = new SkuDB(obj);

		Prod.Skus.push(_object._id);
		const ProdSave = await Prod.save();
		if(!ProdSave) return res.json({status: 400, message: '[server] 对应商品保存失败 '}); 

		const objSave = await _object.save();
		if(!objSave) return res.json({status: 400, message: '[server] 商品Product保存失败 '});

		Prod_save_post_Prom(Prod._id);

		return res.status(200).json({status: 200, message: "[server] 创建成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/SkuPost", error);
		return res.status(500).json({status: 500, message: "[服务器错误: SkuPost]: "+ error});
	}
}




exports.SkuDelete = async(req, res) => {
	console.log("/b1/SkuDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Sku的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		// Sku_path_Func(pathObj, payload);

		const Sku = await SkuDB.findOne(pathObj);
		if(!Sku) return res.json({status: 400, message: "[server] 没有找到此商品Product信息, 请刷新重试"});
		if(!Sku.attrs || Sku.attrs.length == 0) return res.json({status: 400, message: "[server] 不可删除默认Product"});

		const Prod = await ProdDB.findOne({_id: Sku.Prod});
		if(Prod) {
			const index = MdFilter.indexArr_Func(Prod.Skus, id);
			Prod.Skus.splice(index, 1);
			const ProdSave = await Prod.save();
			if(!ProdSave) return res.json({status: 400, message: "[server] 商品保存失败"});
			Prod_save_post_Prom(Prod._id);
		}

		const objDel = await SkuDB.deleteOne({_id: id});
		return res.status(200).json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/SkuDelete", error);
		return res.status(500).json({status: 500, message: "[服务器错误: SkuDelete]"});
	}
}



exports.SkuPut = async(req, res) => {
	console.log("/b1/SkuPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Sku的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		// Sku_path_Func(pathObj, payload);

		const Sku = await SkuDB.findOne(pathObj);
		if(!Sku) return res.json({status: 400, message: "[server] 没有找到此商品Product信息, 请刷新重试"});
		const Prod = await ProdDB.findOne({_id: Sku.Prod, Firm: payload.Firm})
			.populate([{path: "Skus", select: "attrs"}, {path: "Attrs", select: "nome options"}]);
		if(!Prod) return res.json({status: 400, message: "[server] 没有找到相应的商品信息 "});

		const obj = req.body.general;
		if(!obj) return res.json({status: 400, message: "[server] 请传递正确的数据 obj对象数据"});

		if(!obj.attrs || obj.attrs.length == 0) {
			if(String(Prod.Skus[0]._id) != id) return res.json({status: 400, message: '[server] 您没有传递属性 '});
		} else {
			obj.attrs = setAttrs_Func(obj.attrs);
			if(!includes_attrs_Func(Prod.Attrs, obj.attrs)) return res.json({status: 400, message: '[server] 商品中没有此属性'});

			const Skus = Prod.Skus;
			let iPt = 0;
			for(; iPt<Skus.length; iPt++) {	// 对比商品下每个 Sku 是否有此系列属性
				if((String(Skus[iPt]._id) === String(id)) || !Skus[iPt].attrs) {// 当前 sku 属性不计算
					continue;
				}
				if(compareAttrs_Func(obj.attrs, Skus[iPt].attrs)) break;
			}
			if(iPt != Skus.length) return res.json({status: 400, message: '[server] 商品已经有此系列属性 '});
			Sku.attrs = obj.attrs;
		}

		console.log(obj.price_regular)
		if(obj.price_regular && !isNaN(parseFloat(obj.price_regular))) Sku.price_regular =parseFloat(obj.price_regular);
		if(obj.price_sale && !isNaN(parseInt(obj.price_sale))) Sku.price_sale =parseInt(obj.price_sale);
		if(obj.limit_quantity && !isNaN(parseInt(obj.limit_quantity))) Sku.limit_quantity =parseInt(obj.limit_quantity);
		if(obj.quantity && !isNaN(parseInt(obj.quantity))) Sku.quantity =parseInt(obj.quantity);
		if(obj.quantity_alert && !isNaN(parseInt(obj.quantity_alert))) Sku.quantity_alert =parseInt(obj.quantity_alert);
		if(obj.purchase_note) Sku.purchase_note = obj.purchase_note;
		if(obj.is_controlStock == 1 || obj.is_controlStock == "true") {
			Sku.is_controlStock = true;
		} else if(obj.is_controlStock == 0 || obj.is_controlStock == "false") {
			Sku.is_controlStock = false;
		}
		if(obj.allow_backorder == 1 || obj.allow_backorder == "true") {
			Sku.allow_backorder = true;
		} else if(obj.allow_backorder == 0 || obj.allow_backorder == "false") {
			Sku.allow_backorder = false;
		}
		if(obj.is_usable == 1 || obj.is_usable == "true") {
			Sku.is_usable = true;
		} else if(obj.is_usable == 0 || obj.is_usable == "false") {
			Sku.is_usable = false;
		}
		
		Sku.User_upd = payload._id;

		const objSave = await Sku.save();
		if(!objSave) return res.json({status: 400, message: '[server] Product更改保存失败 '}); 

		Prod_save_post_Prom(Prod._id);

		return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/SkuPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: SkuPut]"});
	}
}


const Prod_save_post_Prom = (id) => {
	// price: Float,									// 只读 [由 Skus 决定] 产品价格
	// price_min: Float,								// 只读 [由 Skus 决定]
	// price_max: Float,								// 只读 [由 Skus 决定]
	// is_discount: Boolean, 							// 只读 [由 Skus 决定] 根据 product 中的 is_discount
	// is_sell: Boolean,								// 只读 [由 Skus 决定] 根据 Skus 决定
	return new Promise(async(resolve) => {
		try {
			const Prod = await ProdDB.findOne({_id: id})
				.populate("Skus");
			if(!Prod) return resolve({status: 400, message: "[server] 没有找到此商品信息"});

			if(Prod.is_simple) {
				if(Prod.Skus.length !=1 ) return resolve({status: 400, message: "[server] 商品Sku错误"});
				const SkuDefault = Prod.Skus[0];
				if(SkuDefault.attrs && SkuDefault.attrs.length > 0) return resolve({status: 400, message: "[server] 商品SkuDefault错误"});
				Prod.price_min = Prod.price_max = SkuDefault.price_sale;
				Prod.is_discount = SkuDefault.is_discount;
				Prod.is_sell = SkuDefault.is_sell;
				Prod.is_usable = SkuDefault.is_usable;
			} else {
				// 如果 Prod 为多规格产品 则需要跳过 attrs为空的 Sku
				const SkuDefault = Prod.Skus.filter((item) => {
					return !item.attrs || item.attrs.length == 0;
				});
				if(SkuDefault.length != 1) return resolve({status: 400, message: "[server] 商品SkuDefault错误 您的数据错误 需要删除此产品修复"});
				const SkusAttrs = Prod.Skus.filter((item) => {
					return item.attrs && item.attrs.length > 0;
				});

				if(SkusAttrs.length < 1) return resolve({status: 400, message: "[server] 商品Sku错误"});
				let price_min,price_max,is_discount, is_sell, is_usable;
				for(let i=0; i<SkusAttrs.length; i++) {
					const sk = SkusAttrs[i];
					if(i==0) {
						price_min = sk.price_sale;
						price_max = sk.price_sale;
						is_discount = sk.is_discount;
						is_sell = sk.is_sell;
						is_usable = sk.is_usable;
					} else {
						if(price_min>sk.price_sale) price_min = sk.price_sale;
						if(price_max<sk.price_sale) price_max = sk.price_sale;
						is_discount += sk.is_discount;
						is_sell += sk.is_sell;
						is_usable += sk.is_usable;
					}
				}

				Prod.price_min = price_min;
				Prod.price_max = price_max;
				Prod.is_discount = is_discount ? true: false;
				Prod.is_sell = is_sell ? true: false;
				Prod.is_usable = is_usable ? true: false;
			}
			const ProdSave = await Prod.save();
			resolve({status: 200, data: {object: ProdSave}});

		} catch(error) {
			console.log(".Prod_save_post_Prom", error);
			resolve({status: 400, message: "Prod_save_post_Prom error"});
		}
	})
}









const Sku_path_Func = (pathObj, payload, queryObj) => {
	if(payload) pathObj.Firm = payload.Firm;

	if(payload && payload.role >= ConfUser.role_set.boss) {
		pathObj.Shop = payload.Shop;
	} else {
		if(queryObj.Shops) {
			const ids = MdFilter.getArray_ObjectId_Func(queryObj.Shops);
			pathObj.Shop = {$in: ids};
		}
	}
	if(!queryObj) return;
	pathObj.Prod = queryObj.Prod;
}

const dbSku = 'Sku';
exports.Skus = async(req, res) => {
	console.log("/b1/Skus");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			Identity: payload,
			queryObj: req.query,
			objectDB: SkuDB,
			path_Callback: Sku_path_Func,
			dbName: dbSku,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/Skus", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Skus]"});
	}
}

exports.Sku = async(req, res) => {
	console.log("/b1/Sku");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			Identity: payload,
			queryObj: req.query,
			objectDB: SkuDB,
			path_Callback: Sku_path_Func,
			dbName: dbSku,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/b1/Sku", error);
		return res.status(500).json({status: 500, message: "[服务器错误: Sku]"});
	}
}
