const GetDB = require('../../_db/GetDB');
const ConfUser = require('../../../config/ConfUser.js');

const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const OrderDB = require('../../../models/order/Order');
const OrderSkuDB = require('../../../models/order/OrderSku');
const OrderProdDB = require('../../../models/order/OrderProd');
const CitaDB = require('../../../models/address/Cita');

exports.OrderPut = async(req, res) => {
	console.log("/b1/OrderPut");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;		// 所要更改的Order的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const Order = await OrderDB.findOne({_id: id, User: payload._id, status: ConfOrder.status_obj.placing.num})
			.populate({path: "Shop", select: "serve_Citas"});
		if(!Order) return res.json({status: 400, message: "[server] 没有找到此订单信息, 请刷新重试"});

		if(req.body.ship_info) {
			const ship_info = req.body.ship_info;
			let i=0;
			for(; i<Order.serve_Citas.length; i++) {
				const serve_Cita = Order.serve_Citas[i];
				if(ship_info.Cita === String(serve_Cita.Cita)) break;
			}
			if(i === Order.serve_Citas.length) return res.json({status: 400, message: "[server] 此城市不在服务区"});
			const Cita = await CitaDB.findOne({_id: ship_info.Cita}, {code: 1, nome:1});
			if(!Cita) return res.json({status: 400, message: "[server] 没有找到此城市"});
			ship_info.city = Cita.code;

			Order.ship_info = ship_info;
		}

		const objSave = await Order.save();
		return res.json({status: 200, message: "[server] 修改成功", data: {object: objSave}});
	} catch(error) {
		console.log("/b1/OrderPut", error);
		return res.json({status: 500, message: "[服务器错误: OrderPut]"});
	}
}

// 只有总部可以删除
exports.OrderDelete = async(req, res) => {
	console.log("/b1/OrderDelete");
	try{
		const payload = req.payload;

		const id = req.params.id;		// 所要更改的Order的id
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "[server] 请传递正确的数据 _id"});

		const pathObj = {_id: id, Firm: payload.Firm};
		// const pathObj = {_id: id, is_hide_client: true, Firm: payload.Firm};
		if(payload.Shop) pathObj.Shop = payload.Shop;

		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "[server] 没有找到此订单信息, 请刷新重试"});

		OrderSkuDB.deleteMany({Order: id});
		OrderProdDB.deleteMany({Order: id});
		await OrderDB.deleteOne({_id: id});

		return res.json({status: 200, message: "[server] 删除成功"});
	} catch(error) {
		console.log("/b1/OrderDelete", error);
		return res.json({status: 500, message: "[服务器错误: OrderDelete]"});
	}
}







const Order_path_Func = (pathObj, payload, queryObj) => {
	// pathObj.status = { "$ne": ConfOrder.status_obj.cart.num};
	pathObj.Firm = payload.Firm;
	if(payload.role >= ConfUser.role_set.boss) {
		pathObj.Shop = payload.Shop;
	}

	if(!queryObj) return;
	if(queryObj.status) {
		const arrs = MdFilter.getArrayFromString(queryObj.status);
		// if(arrs.length > 0) pathObj.status["$in"] = arrs;
		if(arrs.length > 0) pathObj.status = {"$in": arrs};
	}
	if(queryObj.Clients && payload.role < ConfUser.role_set.boss) {
		const arrs = MdFilter.getArrayFromString(queryObj.Clients);
		if(arrs.length > 0) pathObj.Client = {"$in": arrs};
	}
	if(queryObj.Shops && payload.role < ConfUser.role_set.boss) {
		const arrs = MdFilter.getArrayFromString(queryObj.Shops);
		if(arrs.length > 0) pathObj.Shop = {"$in": arrs};
	}
}
const dbOrder = 'Order';
exports.Orders = async(req, res) => {
	console.log("/b1/Orders");
	// console.log(req.query)
	try {
		const payload = req.payload || req.ip;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: OrderDB,
			path_Callback: Order_path_Func,
			dbName: dbOrder,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/Orders", error);
		return res.json({status: 500, message: "[服务器错误: Orders]"});
	}
}

exports.Order = async(req, res) => {
	console.log("/b1/Order");
	try {
		const payload = req.payload;
		const GetDB_Filter = {
			id: req.params.id,
			payload: payload,
			queryObj: req.query,
			objectDB: OrderDB,
			path_Callback: Order_path_Func,
			dbName: dbOrder,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		return res.json(db_res);
	} catch(error) {
		console.log("/b1/Order", error);
		return res.json({status: 500, message: "[服务器错误: Order]"});
	}
}