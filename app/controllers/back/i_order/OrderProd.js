const GetDB = require('../../_db/GetDB');
const MdFilter = require('../../../middle/middleFilter');
const OrderProdDB = require('../../../models/order/OrderProd');


const vOrderProd_path_Func = (pathObj, curUser, queryObj) => {
	pathObj.User = curUser._id;

	if(!queryObj) return;
	if(MdFilter.is_ObjectId_Func(queryObj.Order) ) pathObj["Order"] = queryObj.Order;
}

const dbOrderProd = 'OrderProd';
exports.OrderProds = async(req, res) => {
	console.log("/b1/OrderProds");
	try {
		if(!MdFilter.is_ObjectId_Func(req.query.Order)) return res.json({status: 400, message: "[server] 请告知服务器 查看哪个订单中的产品"});

		const curUser = req.curUser;
		const GetDB_Filter = {
			Identity: curUser,
			queryObj: req.query,
			objectDB: OrderProdDB,
			path_Callback: vOrderProd_path_Func,
			dbName: dbOrderProd,
		};
		const dbs_res = await GetDB.dbs(GetDB_Filter);
		return res.status(dbs_res.status).json(dbs_res);
	} catch(error) {
		console.log("/b1/OrderProds", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vOrderProds]"});
	}
}
