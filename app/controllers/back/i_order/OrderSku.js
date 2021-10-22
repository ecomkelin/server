const GetDB = require('../../_db/GetDB');
const ConfUser = require('../../../config/ConfUser.js');
const ConfOrder = require('../../../config/ConfOrder.js');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const OrderSkuDB = require('../../../models/order/OrderSku');
const OrderDB = require('../../../models/order/Order');
const SkuDB = require('../../../models/product/Sku');
const _ = require('underscore');

/*
	添加 商品Sku OrderSku
	要判断是否已存在购物车
		如果存在还要判断 对应商品是否 已在购物车 并继续判断是否存在对应商品在购物车
			如果存在 则创建 OrderSku 并保存再 对应商品中
			如果不存在 则先创建 对应商品 OrderProd 并把OrderProd 保存在购物车列表中 再创建 OrderSku 保存在 对应商品中
		如果不存在 添加购物车 并在购物车中添加 对应商品 再在对应商品中加入 创建OrderSku
*/
exports.OrderSkuPost = async(req, res) => {
	console.log("/b1/OrderPost");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
		// 判断前端给的参数是否 正确 并根据前端给的 _id 从数据库中找到到所需数据
		const obj = req.body.obj;
		if(isNaN(obj.quantity)) return res.json({status: 400, message: '[server] 请正确的输入产品出售数量'});
		obj.quantity = parseInt(obj.quantity);
		if(obj.quantity < 1) return res.json({status: 400, message: "[server] quantity 为大于0 的正整数"});
		if(!obj) return res.json({status: 400, message: '[server] 请传递正确的参数'});
		if(!MdFilter.is_ObjectId_Func(obj.Sku)) return res.json({status: 400, message: '[server] 请输入商品Product _id'});
		const Sku = await SkuDB.findOne({_id: obj.Sku})
			.populate({path: "Prod", select: "nome Pd"})
			.populate({path: "Shop", select: "_id Firm"});
		if(!Sku || !Sku.Shop) return res.json({status: 400, message: '[server] 没有找到相应商品 SKU '});
		const Prod = Sku.Prod;
		if(!Prod) return res.json({status: 400, message: '[server] 没有找到相应商品'});

		// 为 OrderSku 赋值
		obj.price = Sku.price_sale;
		obj.price_regular = Sku.price_regular;
		obj.attrs = "";
		if(Sku.attrs) Sku.attrs.forEach(attr => OrderSkuObj.attrs += `${attr.nome}:${attr.option},`);
		obj.User = payload._id;
		obj.Pd = Prod.Pd;
		obj.Prod = Prod._id;
		obj.Shop = Sku.Shop._id;
		obj.Firm = Sku.Shop.Firm;

		// 查看此客户在此商店 是否有此订单 如果没有 则创建 如果有 则加入
		const Order = await OrderDB.findOne({_id: obj.Order, status: ConfOrder.status_obj.preparing.num})
		if(!Order) return res.json({status: 400, message: "[server] 没有此订单"})
		// 为 Sku 赋值 Order_id
		obj.Order = Order._id;
		// 查看在此购物车中 是否已经添加了 该Sku的 商品
		const OrderProd = await OrderProdDB.findOne({Order: Order._id, Prod: obj.Prod});
		if(OrderProd) {		// 如果购物车中 已存在此商品
			obj.OrderProd = OrderProd._id;
			// 查看是否重复添加
			const objSame = await OrderSkuDB.findOne({OrderProd: obj.OrderProd, Sku: obj.Sku});
			if(objSame) return res.json({status: 400, message: '[server] 购物车中已有此 Sku 请刷新查看'});
			// 创建 OrderSku 数据
			const _OrderSku = new OrderSkuDB(obj);
			// 把 OrdreSku _id 保存到 商品中去
			OrderProd.OrderSkus.unshift(_OrderSku._id);
			const OrderProdSave = await OrderProd.save();
			if(!OrderProdSave) return res.json({status: 400, message: '[server] 添加 Sku 时 更改 OrderProd 错误'});
			// 如果商品保存成功 则保存 Sku
			const OrderSku = await _OrderSku.save();
			if(!OrderSku) return res.json({status: 400, message: '[server] 添加 Sku 时 Sku 保存 错误'});
		} else {// 如果购物车中没有此Sku对应商品 则创建商品
			// 为商品赋值
			const OrderProdObj = {};
			OrderProdObj.Order = obj.Order;
			OrderProdObj.Prod = Sku.Prod._id;
			OrderProdObj.nome = Sku.Prod.nome;
			OrderProdObj.unit = Sku.Prod.unit;
			OrderProdObj.Pd = Sku.Prod.Pd;
			OrderProdObj.User = payload._id;
			OrderProdObj.Shop = obj.Shop;
			OrderProdObj.Firm = obj.Firm;
			OrderProdObj.OrderSkus = [];
			// 创建商品数据
			const _OrderProd = new OrderProdDB(OrderProdObj);
			// 把商品_id 赋值到 Sku中去 并创建 Sku数据
			obj.OrderProd = _OrderProd._id;
			const _OrderSku = new OrderSkuDB(obj);
			// 把Sku _id 存到 OrderProd 中
			_OrderProd.OrderSkus.push(_OrderSku._id);
			// 再把 OrderProd 的 _id 存到 Order 中, 并保存 Order
			Order.OrderProds.push(_OrderProd._id);
			const OrderSave = await Order.save();
			if(!OrderSave) return res.json({status: 400, message: '[server] 添加 Sku ,创建 OrderProd 时 Order 保存 错误'});
			// Order 保存成功 则保存 OrderProd
			const OrderProdSave = await OrderProd.save();
			if(!OrderProdSave) return res.json({status: 400, message: '[server] 添加 Sku, 创建 OrderProd 时 OrderProd 保存 错误'});
			// OrderProd 保存成功 则保存 OrderSku
			const OrderSku = await _OrderSku.save();
			if(!OrderSku) return res.json({status: 400, message: '[server] 添加 Sku 时 Sku 保存 错误'});
		}
		return res.status(200).json({status: 200, message: "[server] 创建成功"});
	} catch(error) {
		console.log("/b1/OrderPost", error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

/*
	删除 Sku
	其实可以 vOrderSkuPut 中的 quantity = 0 就可以实现删除效果
*/
exports.OrderSkuDelete = async(req, res) => {
	console.log("/b1/vOrderSkuDelete");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Order的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id};
		vOrderSku_path_Func(pathObj, payload);

		const OrderSku = await OrderSkuDB.findOne(pathObj)
			.populate([
				{path: "OrderProd", select: "OrderSkus"},
				{path: "Order", select: "status OrderProds"},
			]);
		if(!OrderSku) return res.json({status: 400, message: "[server] 没有找到此Sku信息, 请刷新重试"});

		const OrderProd = OrderSku.OrderProd;
		if(!OrderProd) return res.json({status: 400, message: "[server] 没有找到相应订单商品信息"});

		// 只能删除 购物车的 商品
		const Order = OrderSku.Order;
		if(!Order) return res.json({status: 400, message: "[server] 没有找到相应订单信息"});
		if(Order.status !== ConfOrder.status_obj.preparing.num) return res.json({status: 400, message: "[server] 不可删除"});

		const objDel = await OrderSkuDB.deleteOne({_id: id});
		if(objDel.n !== 1) return res.json({status: 400, message: "[server] 删除失败"});

		const del_res = await this.vOrderSkuDelete_Prom(id, OrderProd, Order);
		return res.status(del_res.status).json(del_res);

		// if(OrderProd.OrderSkus.length === 1) {
		// 	const OrderProd_id = OrderProd._id;
		// 	const OrderProdDel = await OrderDB.deleteOne({_id: OrderProd_id});
		// 	if(OrderProdDel.n !== 1) return res.json({status: 400, message: "[server] 商品中无sku 商品删除失败"});
		// 	const index = MdFilter.indexArr_Func(Order.OrderProds, OrderProd_id);
		// 	if(index >= 0) Order.OrderProds.splice(index, 1);
		// 	const OrderSave = await Order.save()
		// 	if(!OrderSave) return res.json({status: 400, message: "[server] 删除SKU 同时删除商品 Order保存 失败"});
		// } else {
		// 	const index = MdFilter.indexArr_Func(OrderProd.OrderSkus, id);
		// 	if(index >= 0) OrderProd.OrderSkus.splice(index, 1);
		// 	const OrderProdSave = await OrderProd.save()
		// 	if(!OrderProdSave) return res.json({status: 400, message: "[server] 删除SKU 商品保存 失败"});
		// }
		// return res.status(200).json({status: 200, message: "[server] 删除成功"});

	} catch(error) {
		console.log("/b1/vOrderSkuDelete", error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderDelete]"});
	}
}
exports.OrderSkuDelete_Prom = (id, OrderProd, Order) => {
	return new Promise(async(resolve) => {
		try{
			if(OrderProd.OrderSkus.length === 1) {
				const OrderProd_id = OrderProd._id;
				const OrderProdDel = await OrderDB.deleteOne({_id: OrderProd_id});
				if(OrderProdDel.n !== 1) return resolve({status: 400, message: "[server] 商品中无sku 商品删除失败"});
				const index = MdFilter.indexArr_Func(Order.OrderProds, OrderProd_id);
				if(index >= 0) Order.OrderProds.splice(index, 1);
				const OrderSave = await Order.save()
				if(!OrderSave) return resolve({status: 400, message: "[server] 删除SKU 同时删除商品 Order保存 失败"});
			} else {
				const index = MdFilter.indexArr_Func(OrderProd.OrderSkus, id);
				if(index >= 0) OrderProd.OrderSkus.splice(index, 1);
				const OrderProdSave = await OrderProd.save()
				if(!OrderProdSave) return resolve({status: 400, message: "[server] 删除SKU 商品保存 失败"});
			}

			return resolve({status: 200, message: "[server] 删除成功"});
		} catch(error) {
			console.log("b1/OrderSkuDelete_Prom", error);
			return res.status(500).json({status: 500, message: "[服务器错误: OrderDelete]"});
		}
	})
}

exports.OrderSkuPut = async(req, res) => {
	console.log("/b1/OrderSkuPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Order的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});
		const pathObj = {_id: id};
		vOrderSku_path_Func(pathObj, payload);

		const OrderSku = await OrderSkuDB.findOne(pathObj)
			.populate([
				{path: "OrderProd", select: "OrderSkus"},
				{path: "Order", select: "status OrderProds"},
			]);
		if(!OrderSku) return res.json({status: 400, message: "[server] 没有找到此Sku信息, 请刷新重试"});
		const OrderProd = OrderSku.OrderProd;
		if(!OrderProd) return res.json({status: 400, message: "[server] 没有找到所属商品信息, 请刷新重试"});
		// 只能修改 购物车的 商品数量
		const Order = OrderSku.Order;
		if(!Order) return res.json({status: 400, message: "[server] 所属订单不存在"});
		if(Order.status !== ConfOrder.status_obj.preparing.num) return res.json({status: 400, message: "[server] 不可修改商品信息"});

		const quantity = req.body.quantity;
		if(isNaN(quantity)) return res.json({status: 400, message: "[server] 请输入正确的数量"});
		quantity = parseInt(quantity);
		if(quantity < 1) {
			const objDel = await OrderSkuDB.deleteOne({_id: id});
			if(objDel.n !== 1) return res.json({status: 400, message: "[server] 删除失败"});

			const del_res = await this.vOrderSkuDelete_Prom(id, OrderProd, Order);
			return res.status(del_res.status).json(del_res);
		} else {
			OrderSku.quantity = quantity;
			const objSave = await OrderSku.save();

			return res.status(200).json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
		}
	} catch(error) {
		console.log("/b1/OrderSkuPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vOrderSkuPut]"});
	}
}















const vOrderSku_path_Func = (pathObj, payload, queryObj) => {
	pathObj.Firm = payload.Firm;
	if(payload.role > ConfUser.role_set.staff) pathObj.Shop = payload.Shop;

	if(!queryObj) return;
	if(MdFilter.is_ObjectId_Func(queryObj.Order) ) pathObj["Order"] = queryObj.Order;
}
const dbOrderSku = 'OrderSku';

exports.OrderSkus = async(req, res) => {
	console.log("/b1/OrderSkus");
	try {
		if(!MdFilter.is_ObjectId_Func(req.query.Order)) return res.json({status: 400, message: "[server] 请告知服务器 查看哪个订单中的产品"});

		const payload = req.payload;
		const GetDB_Filter = {
			Identity: payload,
			queryObj: req.query,
			objectDB: OrderSkuDB,
			path_Callback: vOrderSku_path_Func,
			dbName: dbOrderSku,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/OrderSkus", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vOrderSkus]"});
	}
}
