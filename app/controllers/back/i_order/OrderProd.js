const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const OrderProdDB = require('../../../models/order/OrderProd');


const vOrderProd_path_Func = (pathObj, payload, queryObj) => {
	pathObj.User = payload._id;

	if(!queryObj) return;
	if(MdFilter.is_ObjectId_Func(queryObj.Order) ) pathObj["Order"] = queryObj.Order;
	if(queryObj.Clients && payload.role < ConfUser.role_set.boss) {
		const arrs = MdFilter.getArrayFromString(queryObj.Clients);
		if(arrs.length > 0) pathObj.Client = {"$in": arrs};
	}
	if(queryObj.Shops && payload.role < ConfUser.role_set.boss) {
		const arrs = MdFilter.getArrayFromString(queryObj.Shops);
		if(arrs.length > 0) pathObj.Shop = {"$in": arrs};
	}
}

const dbOrderProd = 'OrderProd';
exports.OrderProds = async(req, res) => {
	console.log("/b1/OrderProds");
	try {
		// if(!MdFilter.is_ObjectId_Func(req.query.Order)) return res.json({status: 400, message: "[server] 请告知服务器 查看哪个订单中的产品"});

		const payload = req.payload;
		const GetDB_Filter = {
			payload: payload,
			queryObj: req.query,
			objectDB: OrderProdDB,
			path_Callback: vOrderProd_path_Func,
			dbName: dbOrderProd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.json(dbs_res);
	} catch(error) {
		console.log("/b1/OrderProds", error);
		return res.json({status: 500, message: "[服务器错误: vOrderProds]"});
	}
}
