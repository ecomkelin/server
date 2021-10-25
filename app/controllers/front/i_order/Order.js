const moment = require('moment');

const GetDB = require('../../_db/GetDB');
const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');

const ShopDB = require('../../../models/auth/Shop');
const ProdDB = require('../../../models/product/Prod');
const SkuDB = require('../../../models/product/Sku');
const OrderDB = require('../../../models/order/Order');
const OrderProdDB = require('../../../models/order/OrderProd');
const OrderSkuDB = require('../../../models/order/OrderSku');

const CitaDB = require('../../../models/address/Cita');

exports.vOrderPost = async(req, res) => {
	console.log("/v1/OrderPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		// 判断 基本参数 是否正确
		const obj_Order = req.body.obj;

		if(!obj_Order.type_ship) return res.json({status: 400, message: "[server] 请传递正确的type_ship数据"})

		const org_OrderId = req.body.Order ? req.body.Order : false;
		delete obj_Order._id;
		if(!obj_Order) return res.json({status: 400, message: "[server] 请传递正确的obj数据"});
		if(!MdFilter.is_ObjectId_Func(obj_Order.Shop)) return res.json({status: 400, message: "[server] 请传递正确的 Shop _id 信息"});
		const Shop = await ShopDB.findOne({_id: obj_Order.Shop, is_usable: 1}, {code:1, serve_Cita: 1, Firm: 1});
		if(!Shop) return res.json({status: 400, message: "[server] 没有找到此商店信息"});

		// 订单的送货方式
		if(obj_Order.type_ship == ConfOrder.type_ship_obj.sClient.num) {
			obj_Order.ship_info = null;
		} else {
			// 判断送货城市 是否在商店服务范围
			let i=0;
			for(; i<Shop.serve_Citas.length; i++) {
				const serve_Cita = Shop.serve_Citas[i];
				if(obj_Order.ship_info.Cita === String(serve_Cita.Cita)) break;
			}
			if(i === Shop.serve_Citas.length) return res.json({status: 400, message: "[server] 此城市不在服务区"});
			const Cita = await CitaDB.findOne({_id: obj_Order.ship_info.Cita}, {code: 1, nome:1});
			if(!Cita) return res.json({status: 400, message: "[server] 没有找到此城市"});
			obj_Order.ship_info.city = Cita.code;
		}

		// 基本信息赋值
		const code_res = await generate_codeOrder_Prom(Shop._id, Shop.code);
		if(code_res.status !== 200) return resolve({status: 400, message: code_res.message});
		obj_Order.code = code_res.data.code;
		// obj_Order.shop 已赋值
		obj_Order.Client = payload._id;
		obj_Order.Firm = Shop.Firm;
		obj_Order.status = ConfOrder.status_obj.placing.num;
		obj_Order.type_Order = ConfOrder.type_Order_obj.sale.num;

		obj_Order.imp = parseFloat(obj_Order.imp);
		obj_Order.total_quantity = 0;
		obj_Order.total_sale = 0;
		obj_Order.total_regular = 0;
		obj_Order.at_confirm = Date.now();

		if(!(obj_Order.OrderProds instanceof Array)) return res.json({status: 400, message: "[server] 购物车中的产品数据 obj.OrderProds 参数错误[应该是数组]"});
		const oProds = [...obj_Order.OrderProds];

		obj_Order.OrderProds = [];	// 数据格式化, 在循环中再添加 OrderProd 的 _id;
		// 保存 订单基本信息
		const _Order = new OrderDB(obj_Order);

		for(let i = 0; i<oProds.length; i++){
			const obj_OrderProd = oProds[i];
			if(!MdFilter.is_ObjectId_Func(obj_OrderProd.Prod)) continue;
			const Prod = await ProdDB.findOne({_id: obj_OrderProd.Prod, Shop: obj_Order.Shop});
			// if(!Prod || Prod.is_usable === false || Prod.is_sell === false) continue;
			if(!Prod) continue;
			obj_OrderProd.Order = _Order._id;
			obj_OrderProd.Client = _Order.Client;
			obj_OrderProd.Shop = _Order.Shop;
			obj_OrderProd.Firm = _Order.Firm;
			obj_OrderProd.Pd = Prod.Pd;

			obj_OrderProd.nome = Prod.nome;
			obj_OrderProd.unit = Prod.unit;

			obj_OrderProd.prod_quantity = 0;
			obj_OrderProd.prod_sale = 0;
			obj_OrderProd.prod_regular = 0;

			if(!(obj_OrderProd.OrderSkus instanceof Array)) continue;
			const oSkus = [...obj_OrderProd.OrderSkus];
			obj_OrderProd.OrderSkus = [];

			const _OrderProd = new OrderProdDB(obj_OrderProd);

			for(let j=0; j<oSkus.length; j++) {
				const obj_OrderSku = oSkus[j];
				if(!MdFilter.is_ObjectId_Func(obj_OrderSku.Sku)) continue;
				const Sku = await SkuDB.findOne({_id: obj_OrderSku.Sku, Prod: Prod._id});
				// if(!Sku || Sku.is_usable === false || Sku.is_sell === false) continue;
				if(!Sku) continue;
				obj_OrderSku.OrderProd = _OrderProd._id;
				obj_OrderSku.Order = _OrderProd.Order;

				obj_OrderSku.Client = _OrderProd.Client;
				obj_OrderSku.Shop = _OrderProd.Shop;
				obj_OrderSku.Firm = _OrderProd.Firm;
				obj_OrderSku.Pd = _OrderProd.Pd;
				obj_OrderSku.Prod = _OrderProd.Prod;

				obj_OrderSku.attrs = "";
				if(Sku.attrs) Sku.attrs.forEach(attr => obj_OrderSku.attrs += `${attr.nome}:${attr.option},`);
				obj_OrderSku.price = Sku.price_sale;
				obj_OrderSku.quantity = parseInt(obj_OrderSku.quantity);
				if(isNaN(obj_OrderSku.quantity) || obj_OrderSku.quantity < 1) continue;
				obj_OrderSku.price_regular = Sku.price_regular;
				const _OrderSku = new OrderSkuDB(obj_OrderSku);
				const OSkuSave = await _OrderSku.save();
				if(!OSkuSave) continue;

				_OrderProd.prod_quantity += OSkuSave.quantity;
				_OrderProd.prod_sale += OSkuSave.price * OSkuSave.quantity;
				_OrderProd.prod_regular += Sku.price_regular * OSkuSave.quantity;
				_OrderProd.OrderSkus.push(OSkuSave._id);
			}
			// 判断 如果订单 商品下没有 Sku 则说明没有买此商品 则跳过
			if(_OrderProd.prod_quantity < 1) continue;
			const OProdSave = await _OrderProd.save();
			if(!OProdSave) {
				OrderSkuDB.deleteMany({OrderProd: _OrderProd._id});
				continue;
			}

			_Order.total_quantity += OProdSave.prod_quantity;
			_Order.total_regular += OProdSave.prod_regular;
			_Order.total_sale += OProdSave.prod_sale;
			_Order.OrderProds.push(OProdSave._id);
		}
		_Order.imp = _Order.total_sale;

		// 判断 如果订单 下没有采购商品 则错误
		if(_Order.total_quantity < 1) return res.json({status: 400, message: "[server] 订单中没有产品"});
		const OrderSave = await _Order.save();
		if(!OrderSave) {
			 OrderSkuDB.deleteMany({Order: _Order._id});
			 OrderProdDB.deleteMany({Order: _Order._id});
		} else {
			// 删除重现下单的 订单
			if(MdFilter.is_ObjectId_Func(org_OrderId)) {
				const org_Order = await OrderDB.findOne({_id: org_OrderId, status: {$in: ConfOrder.status_confirms}});
				if(org_Order) {
					OrderSkuDB.deleteMany({Order: org_OrderId});
					OrderProdDB.deleteMany({Order: org_OrderId});
					OrderDB.deleteOne({_id: org_OrderId});
				}
			} 
		}
		// 返回给前端，  如果不正确 可以尝试 放到 crt_OrderProds_Fucn 中。 如果正确 要删掉 res 参数
		return res.json({status: 200, data: {object: OrderSave}});
	} catch(error) {
		console.log("/v1/OrderPost", error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]"});
	}
}

const generate_codeOrder_Prom = (Shop_id, Shop_code) => {
	return new Promise(async(resolve) => {
		try{
			const pre_Order = await OrderDB.findOne({Shop: Shop_id, code: {'$ne': null}})
				.sort({'at_crt': -1});

			const nowDate = new Date();
			const today = moment(nowDate).format("YYMMDD");

			let codeNum = 1;
			if(pre_Order) {
				const [data_Order, Num_Order] = pre_Order.code.split(Shop_code);
				if(today == data_Order) {
					codeNum = parseInt(Num_Order)+1;
				}
			}
			const codePre = `${today}${Shop_code}`;
			const code_res = await recu_codeOrderSame_Prom(codePre, codeNum);
			if(code_res.status === 400) return resolve({status: 400, message: code_res.message});
			return resolve({status: 200, data: {code: code_res.code}});

		} catch(error) {
			console.log("v1/generate_codeOrder_Prom", error);
			return resolve({status: 400, message: "[server generate_codeOrder_Prom] Error"});
		}
	})
}
const recu_codeOrderSame_Prom = (codePre, codeNum) => {
	return new Promise(async(resolve) => {
		try{
			codeNum = String(codeNum);
			for(let len = codeNum.length; len < 4; len = codeNum.length) { // 序列号补0
				codeNum = "0" + codeNum;
			}
			const objSame = await OrderDB.findOne({code: codePre+codeNum});
			if(objSame) {
				codeNum = parseInt(codeNum) + 1;
				const this_prom = await recu_codeOrderSame_Prom(codePre, codeNum);
				if(this_prom.status === 200) return resolve({status: 200, code: this_prom.code});
				return resolve({status: 400, code: this_prom.message});
			} else {
				return resolve({status: 200, code: codePre+codeNum});
			}
		} catch(error) {
			console.log("v1/recu_codeOrderSame_Prom", error);
			return resolve({status: 400, message: "[server recu_codeOrderSame_Prom] Error"});
		}
	})
}












exports.vOrderPut = async(req, res) => {
	console.log("/v1/OrderPut_ship");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Order的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Order = await OrderDB.findOne({_id: id, Client: payload._id, status: ConfOrder.status_obj.placing.num})
			.populate({path: "Shop", select: "serve_Citas"});
		if(!Order) return res.json({status: 400, message: "[server] 没有找到此产品信息, 请刷新重试"});

		const obj = req.body.general;

		if(obj) {
			if(ConfOrder.type_ship_Arrs.includes(obj.type_ship)) Order.type_ship = obj.type_ship;	
			if(ConfOrder.type_paid_Arrs.includes(obj.type_paid)) Order.type_paid = obj.type_paid;
			if(obj.note_Client) Order.note_Client = obj.note_Client;	
		}

		const paid_info = req.body.paid_info;
		if(!Order.type_paid || Order.type_paid === ConfOrder.type_paid_obj.cash.num) {
			Order.paid_info = null;
		} else if(paid_info) {
			Order.paid_info = paid_info;
		}


		const objSave = await Order.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/v1/OrderPut_ship", error);
		return res.json({status: 500, message: "[服务器错误: vOrderPut_ship]"});
	}
}







const vOrder_path_Func = (pathObj, payload, queryObj) => {
	pathObj.is_hide_client = false;
	// pathObj.status = { "$ne": ConfOrder.status_obj.cart.num};
	pathObj.Client = payload._id;

	if(!queryObj) return;
	if(queryObj.status) {
		const arrs = MdFilter.getArrayFromString(queryObj.status);
		// if(arrs.length > 0) pathObj.status["$in"] = arrs;
		if(arrs.length > 0) pathObj.status = {"$in": arrs};
	}
}
const dbOrder = 'Order';
exports.vOrders = async(req, res) => {
	console.log("/v1/Orders")
	try {
		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: OrderDB,
			path_Callback: vOrder_path_Func,
			dbName: dbOrder,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/v1/Orders", error)
		console.log(error);
		return res.json({status: 500, message: "[服务器错误: vOrders]"});
	}
}

exports.vOrder = async(req, res) => {
	console.log("/v1/Order");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: OrderDB,
			path_Callback: vOrder_path_Func,
			dbName: dbOrder,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/v1/Order", error);
		return res.json({status: 500, message: "[服务器错误: vOrder]"});
	}
}