const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const OrderDB = require('../../../models/order/Order');

const OrderSkuCtrl = require('./OrderSku');
const moment = require('moment');

exports.Order_change_status = async(req, res) => {
	console.log("/b1/Order_change_status");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const action = req.body.action;
		if(!action) return res.json({status: 400, message: "请传递您对订单的操作"});

		if(action === ConfOrder.action.back.confirm) {
			Order_status_confirm(req, res, id, payload);
		} else if(action === ConfOrder.action.back.done) {
			Order_status_done(req, res, id, payload);
		} else if(action === ConfOrder.action.back.complete) {
			Order_status_complete(req, res, id, payload);
		} else {
			return res.json({status: 400, message: "请传递您对订单的正确操作"});
		}
	} catch(error) {
		console.log("/b1/Order_change_status", error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const Order_status_confirm = async(req, res, id, payload) => {
	try{
		console.log(id)
		// const Order1 = await OrderDB.findOne({_id: id});
		// console.log(111, Order1.status)
		// console.log(111, ConfOrder.status_obj.responding.num)
		// console.log(222, Order1.Shop)
		// console.log(222, Order1.payload.Shop)
		const pathObj = {_id: id, status: ConfOrder.status_obj.responding.num, Shop: payload.Shop};
		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "没有找到此订单"});

		Order.status = ConfOrder.status_obj.preparing.num;
		Order.User_Oder = payload._id;
		const OrderSave = await Order.save();
		return res.json({status: 200, message: "[server] 成功接单"});
	} catch(error) {
		console.log("b1/Order_status_confirm", error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const Order_status_done = async(req, res, id, payload) => {
	try{
		const pathObj = {_id: id, status: ConfOrder.status_obj.preparing.num, Shop: payload.Shop};
		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "没有找到此订单"});

		Order.status = ConfOrder.status_obj.shipping.num;
		Order.User_Pker = payload._id;
		const OrderSave = await Order.save();
		return res.json({status: 200, message: "[server] 配货完成"});

	} catch(error) {
		console.log("b1/Order_status_done",error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const Order_status_complete = async(req, res, id, payload) => {
	try{
		const pathObj = {_id: id, status: ConfOrder.status_obj.shipping.num, Shop: payload.Shop};
		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "没有找到此订单"});

		Order.status = ConfOrder.status_obj.completed.num;
		Order.is_paid = true;
		Order.User_Dver = payload._id;
		const OrderSave = await Order.save();
		return res.json({status: 200, message: "[server] 配送完成"});

	} catch(error) {
		console.log("b1/Order_status_complete",error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}