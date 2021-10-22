const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const OrderDB = require('../../../models/order/Order');

const OrderSkuCtrl = require('./OrderSku');
const moment = require('moment');

exports.Order_change_status = async(req, res) => {
	console.log("/b1/Order_change_status");
	try{
		const curUser = req.curUser;
		if(MdSafe.fq_spanTimes1_Func(curUser._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const action = req.body.action;
		if(!action) return res.json({status: 400, message: "请传递您对订单的操作"});

		if(action === ConfOrder.action.back.confirm) {
			Order_status_confirm(req, res, id, curUser);
		} else if(action === ConfOrder.action.back.done) {
			Order_status_done(req, res, id, curUser);
		} else if(action === ConfOrder.action.back.complete) {
			Order_status_complete(req, res, id, curUser);
		}
		return res.json({status: 400, message: "请传递您对订单的正确操作"});
	} catch(error) {
		console.log("/b1/Order_change_status", error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const Order_status_confirm = async(req, res, id, curUser) => {
	try{
		const pathObj = {_id: id, status: ConfOrder.status_obj.responding.num, Shop: curUser.Shop};
		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "没有找到此订单"});

		Order.status = ConfOrder.status_obj.preparing.num;
		Order.User_Oder = curUser._id;
		const OrderSave = await Order.save();
		return res.status(200).json({status: 200, message: "[server] 成功接单"});
	} catch(error) {
		console.log("b1/Order_status_confirm", error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const Order_status_done = async(req, res, id, curUser) => {
	try{
		const pathObj = {_id: id, status: ConfOrder.status_obj.preparing.num, Shop: curUser.Shop};
		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "没有找到此订单"});

		Order.status = ConfOrder.status_obj.shipping.num;
		Order.User_Pker = curUser._id;
		const OrderSave = await Order.save();
		return res.json({status: 400, message: "[server] 配货完成"});

	} catch(error) {
		console.log("b1/Order_status_done",error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const Order_status_complete = async(req, res, id, curUser) => {
	try{
		const pathObj = {_id: id, status: ConfOrder.status_obj.shipping.num, Shop: curUser.Shop};
		const Order = await OrderDB.findOne(pathObj);
		if(!Order) return res.json({status: 400, message: "没有找到此订单"});

		Order.status = ConfOrder.status_obj.completed.num;
		Order.User_Dver = curUser._id;
		const OrderSave = await Order.save();
		return res.json({status: 400, message: "[server] 配送完成"});

	} catch(error) {
		console.log("b1/Order_status_complete",error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}