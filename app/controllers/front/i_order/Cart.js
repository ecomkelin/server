const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const OrderDB = require('../../../models/order/Order');

const moment = require('moment');

exports.vCardCreate = async(req, res) => {
	console.log("/v1/CardCreate");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
	 	
	 	const org_Order = req.params.id;
	 	if(!MdFilter.is_ObjectId_Func(org_Order)) return res.json({status: 400, message: "[server] 原订单 id错误"});
	 	const Order = await OrderDB.findOne({_id: org_Order})
	 		.populate({
	 			path: 'OrderProds',
	 			populate: [
	 				{path: 'Prod', select: 'nome unit img_urls'},
	 				{path: 'OrderSkus', populate: {
	 					path: 'Sku',
	 				}}
	 			]
	 		})
	 	if(!Order) return res.json({status: 400, message: "[server] 没有找到此订单信息"});

	 	return res.status(200).json({status: 200, data: {object: Order, org_Order}});
	} catch(error) {
		console.log("/v1/CardCreate", error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

exports.vCard_proof = async(req, res) => {
	console.log("/v1/Card_proof");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
 
		const chgSkus = [];
		const obj = req.body.obj;
		if(!obj || !MdFilter.is_ObjectId_Func(obj.Shop)) return res.json({status: 400, message: "请传递正确的参数 obj 或 obj.Shop"});
		if(!(obj.OrderSkus instanceof Array)) return res.json({status: 400, message: "[server] obj.OrderSkus 参数错误[应该是数组]"});
		for(let i=0; i<obj.OrderSkus.length; i++) {
			const OrderProd = obj.OrderSkus[i];
			if(!MdFilter.is_ObjectId_Func(OrderProd.Prod)) return res.json({status: 400, message: "[server] 购物车中的产品数据 obj.OrderProds[{Prod}] 参数错误[ObjectId]"});
			if(!(OrderProd.OrderSkus instanceof Array)) return res.json({status: 400, message: "[server] 购物车中的产品数据 obj.OrderProds[{OrderSkus}] 参数错误[应该是数组]"});
			const Prod = await ProdDB.findOne({_id: OrderProd.Prod});

		}
		return res.status(200).json({status: 200, message: "[server] confirm 成功", data: {object: Order, changeObjs}});
	} catch(error) {
		console.log("/v1/Card_proof", error);
		return res.status(500).json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}