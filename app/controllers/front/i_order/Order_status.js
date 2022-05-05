const ConfOrder = require('../../../config/ConfOrder');
const MdFilter = require('../../../middle/middleFilter');
const MdSafe = require('../../../middle/middleSafe');
const OrderDB = require('../../../models/order/Order');
const OrderProdDB = require('../../../models/order/OrderProd');
const OrderSkuDB = require('../../../models/order/OrderSku');

const moment = require('moment');

exports.vOrder_change_status = async(req, res) => {
	console.log("/v1/Order_change_status");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});

		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const action = req.body.action;
		if(!action) return res.json({status: 400, message: "请传递您对订单的操作"});

		let action_prom = null;
		if(action === ConfOrder.action.front.place) { // 下单
			action_prom = await vOrder_status_place_Prom(id, payload);
		} else if(action === ConfOrder.action.front.trash) {	// 客户删除订单, 客户不可见
			action_prom = await vOrder_status_trash_Prom(id, payload);
		} else if(action === ConfOrder.action.front.cancel) {	// 客户取消订单
			action_prom = await vOrder_status_cancel_Prom(id, payload);
		}

		if(action_prom) return res.json(action_prom);
		return res.json({status: 400, message: "请传递您对订单的正确操作"}); 
	} catch(error) {
		console.log("/v1/Order_change_status", error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

exports.vOrder_proof = async(req, res) => {
	console.log("/v1/Order_proof");
	try{
		const payload = req.payload;
		if(MdSafe.fq_spanTimes1_Func(payload._id)) return res.json({status: 400, message: "[server] 您刷新太过频繁"});
 
		const id = req.params.id;
		if(!MdFilter.is_ObjectId_Func(id)) return res.json({status: 400, message: "请传递正确的数据 _id"});

		const pathObj = {_id: id, Client: payload._id};
		// 找到所选订单

		// 如果上次校准时间 大于2个小时 则可以重新校准
		let changeObjs = [];

		const proof_prom = await vOrder_proof_Prom(pathObj);
		if(proof_prom.status !== 200) return res.json(proof_prom);
		const Order = proof_prom.data.Order;
		changeObjs = proof_prom.data.changeObjs;

		const OrderSave = await Order.save();

		return res.json({status: 200, message: "[server] confirm 成功", data: {object: Order, changeObjs}});
	} catch(error) {
		console.log("/v1/Order_proof", error);
		return res.json({status: 500, message: "[服务器错误: OrderPost]: "+ error});
	}
}

const vOrderSkuDelete_Prom = (id, OrderProd, Order) => {
	return new Promise(async(resolve) => {
		try{
			const objDel = await OrderSkuDB.deleteOne({_id: id});
			if(objDel.n !== 1) return res.json({status: 400, message: "[server] 删除失败"});

			const data = {
				type_delSku: 0,
				OrderSku: id,
				OrderProd: OrderProd._id,
				Order : Order._id,
			};
			if(OrderProd.OrderSkus.length === 1) {
				const OrderProd_id = OrderProd._id;
				const OrderProdDel = await OrderProdDB.deleteOne({_id: OrderProd_id});
				if(OrderProdDel.n !== 1) return resolve({status: 400, message: "[server] 删除OrderSku时 商品删除失败"});
				const index = MdFilter.indexArr_Func(Order.OrderProds, OrderProd_id);
				if(index >= 0) Order.OrderProds.splice(index, 1);
				const OrderSave = await Order.save()
				if(!OrderSave) return resolve({status: 400, message: "[server] 删除SKU 同时删除商品 Order保存 失败"});
				data.type_delSku = 2;
			} else {
				const index = MdFilter.indexArr_Func(OrderProd.OrderSkus, id);
				if(index >= 0) OrderProd.OrderSkus.splice(index, 1);
				const OrderProdSave = await OrderProd.save()
				if(!OrderProdSave) return resolve({status: 400, message: "[server] 删除SKU 商品保存 失败"});
				data.type_delSku = 1;
			}

			return resolve({status: 200, message: "[server] 删除成功", data});
		} catch(error) {
			console.log("v1/OrderSkuDelete_Prom", error);
			return res.json({status: 500, message: "[服务器错误: OrderDelete]"});
		}
	})
}
const vOrder_proof_Prom = (pathObj) => {
	// console.log("/vOrder_proof_Prom");
	return new Promise(async(resolve) => {
		try {
			const Order = await OrderDB.findOne(pathObj)
				.populate("Shop", "code")
				.populate({
					path: "OrderProds", select: "OrderSkus Prod nome unit",
					populate: [
					{path: "Prod", select: "nome unit"},
					{
						path: "OrderSkus",
						slelect: "price_sale price_regular quantity attrs Sku",
						populate: {
							path: "Sku",
							slelect: "price_sale price_regular quantity is_usable is_sell"
						}
					}]
				});
			if(!Order) return resolve({status: 400, message: "[server] 没有找到此订单信息, 请刷新重试"});
			if(!ConfOrder.status_confirms.includes(Order.status)) return resolve({status: 400, message: "[server] 此状态不可校对"});

			const OrderProds = Order.OrderProds;
			if(!OrderProds || OrderProds.length < 0) return resolve({status: 400, message: "[server] 此购物车中没有商品"});

			const changeObjs = [];

			let total_regular = 0;
			let total_sale = 0;
			for(let i=0; i<OrderProds.length; i++) {
				const OrderProd = OrderProds[i];

				// 如果商品名称和单位被改变了 则需要改变购物车中商品的名称和单位
				const Prod = OrderProd.Prod;
				if(OrderProd.nome !== Prod.nome || OrderProd.unit !== Prod.unit) {
					OrderProd.nome = Prod.nome;
					OrderProd.unit = Prod.unit;
					OrderProd.save();
				}
				// if(!OrderSkus)
				for(let j=0; j<OrderProd.OrderSkus.length; j++) {

					const OrderSku = OrderProd.OrderSkus[j];

					let img_url = null;
					if(OrderProd && OrderProd.Prod && OrderProd.Prod.img_urls && OrderProd.Prod.img_urls.length > 0) {
						img_url = OrderProd.Prod.img_urls[0];
					}
					const changeObj = {
						type: "",
						nome: OrderProd.nome,
						img_url,
						attrs: OrderSku.attrs,
						price_sale: OrderSku.price_sale,
					};
					// if(!OrderSku)
					const Sku = OrderSku.Sku;
					// 校验购物车中的商品 Sku 是否还在出售
					if(!Sku || !Sku.is_sell) {
						// 如果不再出售 则删除 购物车中的商品
						const delSku_prom = await vOrderSkuDelete_Prom(OrderSku._id, OrderProd, Order);
						if(!delSku_prom || delSku_prom.status !== 200) return resolve(delSku_prom);

						changeObj.type = "cancel";
						changeObjs.push(changeObj);
					} else {
						// 购物车中商品Sku的售价 和 标价是否被改变
						let is_change = false;
						if(OrderSku.price_sale !== Sku.price_sale) {
							changeObj.price_sale = OrderSku.price_sale;
							OrderSku.price_sale = Sku.price_sale;
							is_change = true;
						}
						// if(OrderSku.price_regular !== Sku.price_regular) {
						// 	changeObj.price_regular = OrderSku.price_regular;
						// 	OrderSku.price_regular = Sku.price_regular;
						// 	is_change = true;
						// }
						// 如果购物车中的商品数量 大于 库存数量 不可轻易改变, 变动较大
						// if(OrderSku.quantity > Sku.quantity) {
						// 	OrderSku.quantity = Sku.quantity;
						// 	is_change = true;
						// }
						// 如果购物车中的 商品Sku发生了改变 则保存为新的Sku
						if(is_change) {
							const OrderSkuSave = await OrderSku.save();
							if(!OrderSkuSave) return resolve({status: 400, message: "[server] OrderSku更新 保存错误"});
							changeObj.type = "change";
							changeObjs.push(changeObj);
						}
						total_regular += OrderSku.price_regular;
						total_sale += OrderSku.price_sale;
					}

				}
			}

			Order.total_regular = total_regular;
			Order.total_sale = total_sale;
			Order.total_discount = total_regular - total_sale;

			return resolve({status: 200, data: {Order, changeObjs}});
		} catch(error) {
			console.log("v1/Order_proof_Prom", error);
			return resolve({status: 400, message: "[server vOrder_proof_Prom] Error"});
		}
	})
}


// 确认下单
const vOrder_status_place_Prom = async(id, payload) => {
	console.log('v1/vOrder_status_place');
	return new Promise(async(resolve) => {
		try{
			const pathObj = {_id: id, status: ConfOrder.status_obj.placing.num, Client: payload._id};
			const Order = await OrderDB.findOne(pathObj);
			if(!Order) return resolve({status: 400, message: "没有找到此订单"});

			let OrderSave = null;
			let message = '';
			const timeSpan = Date.now() - Order.at_confirm;
			if(timeSpan > ConfOrder.clientTime) {
				// 如果待下单的订单 在15分钟内未下单 则订单自动进入取消状态(前台可以提示超时未下单 取消);
				Order.code += '-60';
				Order.at_confirm = null;
				Order.status = ConfOrder.status_obj.cancel.num;
				OrderSave = await Order.save();
				if(!OrderSave) message = "下单超时 保存失败";
				message = "下单超时";
			} else {
				let place = true;
				// 如果不是到店自取 则需要输入收货信息
				if(Order.type_ship!==0){
					if(!Order.ship_info) return resolve({status: 400, message: "请填写收货人信息"});
					if(!Order.ship_info.Cita) return resolve({status: 400, message: "没有收货城市信息"});
					if(!Order.ship_info.address) return resolve({status: 400, message: "请填写收货人地址"});
					if(!Order.ship_info.phone) return resolve({status: 400, message: "请填写收货人电话"});
				}

				// 如果不是货到付款
				if(Order.type_paid !== 0) {
					// 第三方付款
					if(0) place = false;
				}

				// 如果没有预计时间 则自动变为现在
				if(!Order.at_schedule) Order.at_schedule = Date.now();

				if(place === true){ // 下单成功
					Order.at_paid = Date.now();
					Order.status = ConfOrder.status_obj.responding.num;
					OrderSave = await Order.save();
					if(!OrderSave) message = "下单成功 数据库保存失败, 请处理";
					message = "下单成功";
				} else { // 如果支付失败 则订单进入 下单失败状态;
					Order.code += '-70';
					Order.at_confirm = null;
					Order.status = ConfOrder.status_obj.cancel.num;
					OrderSave = await Order.save();
					if(!OrderSave) message = "下单失败 并且 保存失败";
					message = "下单失败";
				}
			}
			return resolve({status: 200, message, data: {object: OrderSave}});
		} catch(error) {
			console.log("v1/Order_status_place_Prom", error);
			return resolve({status: 500, message: "[服务器错误: OrderPost]: "+ error});
		}
	})
}




const vOrder_status_cancel_Prom = async(id, payload) => {
	return new Promise(async(resolve) => {
		try{
			const pathObj = {_id: id, status: ConfOrder.status_obj.placing.num, Client: payload._id};
			const Order = await OrderDB.findOne(pathObj);
			if(!Order) return resolve({status: 400, message: "没有找到此订单"});

			// 如果待下单订单 在15分钟内未下单 则订单自动进入超时状态
			Order.code += '-10';
			Order.at_confirm = null;
			Order.status = ConfOrder.status_obj.cancel.num;
			const OrderSave = await Order.save();
			let message = "订单已取消";
			if(!OrderSave) message = "取消订单 保存失败";
			return resolve({status: 400, message});
		} catch(error) {
			console.log("v1/Order_status_cancel_Prom", error);
			return resolve({status: 500, message: "[服务器错误: OrderPost]: "+ error});
		}
	})
}

const vOrder_status_trash_Prom = async(id, payload) => {
	return new Promise(async(resolve) => {
		try{
			const pathObj = {
				_id: id,
				Client: payload._id,
				status: {$in: [ConfOrder.status_obj.completed.num, ...ConfOrder.status_confirms]},
			};
			const Order = await OrderDB.findOne(pathObj);
			if(!Order) return resolve({status: 400, message: "没有找到此订单"});

			Order.is_hide_client = true;
			const OrderSave = await Order.save();
			return resolve({status: 400, message: "订单已被客户删除"});

		} catch(error) {
			console.log("v1/Order_status_trash_Prom", error);
			return resolve({status: 500, message: "[服务器错误: OrderPost]: "+ error});
		}
	})
}
