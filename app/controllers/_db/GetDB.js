const dbFilter = require('../../config/dbFilter');
const MdFilter = require('../../middle/middleFilter');
const MdSafe = require('../../middle/middleSafe');

exports.db = (GetDB_Filter) => {
	// console.log("/db")
	return new Promise(async(resolve) => {
		try{
			const {id, payload, queryObj, objectDB, path_Callback, dbName} = GetDB_Filter;
			if(MdSafe.fq_spanTimes1_Func((payload&&payload._id)?payload._id:payload)) resolve({status: 400, message: "[server] 您刷新太过频繁"});
			if(!id || !MdFilter.is_ObjectId_Func(id)) resolve({status: 400, message: "[server] 请传递正确的数据 _id"});

			const pathObj = {_id: id};
			if(path_Callback) path_Callback(pathObj, payload, queryObj);
			const selectObj = MdFilter.select_func(queryObj.selects, queryObj.selectVal, dbName, payload);

			// console.log("/db queryObj populateObjs", queryObj.populateObjs)
			const populateObjs = dbFilter.limitPopulate(queryObj.populateObjs, payload, dbName);

			// console.log("/db populateObjs", populateObjs)
			const object = await objectDB.findOne(pathObj, selectObj)
				.populate(populateObjs);
			if(!object) resolve({status: 400, message: "[server] 没有找到数据"});
			return resolve({status: 200, message: '[server] 成功读取', data: {object}});
		} catch(error) {
			console.log("/db", error)
			return resolve({status: 500, message: "[服务器错误: GetDB.db]"});
		}
	})
}

/*
	payload: 身份
	queryObj: 前端传递的参数
	objectDB: 传递的数据库模型
	path_Callback: function;
*/
exports.dbs = (GetDB_Filter) => {
	return new Promise(async(resolve) => {
		try{
			const {payload, queryObj, objectDB, path_Callback, dbName} = GetDB_Filter;
			if(MdSafe.fq_spanTimes1_Func((payload&&payload._id)?payload._id:payload)) resolve({status: 400, message: "[server] 您刷新太过频繁"});

			// 确定数据的页码和每夜条目数
			const {page, pagesize, skip} = MdFilter.page_Func(parseInt(queryObj.page), parseInt(queryObj.pagesize));

			// 过一遍整体 path
			const pathObj = MdFilter.path_Func(queryObj);
			// 再过一遍 特殊 path
			if(path_Callback) path_Callback(pathObj, payload, queryObj);

			const selectObj = MdFilter.select_func(queryObj.selects, queryObj.selectVal, dbName, payload);

			const populateObjs = dbFilter.limitPopulate(queryObj.populateObjs, payload);

			const sortObj = MdFilter.sort_Func(queryObj.sortKey, parseInt(queryObj.sortVal), dbName);
			// console.log('dbs', sortObj)
			const count = await objectDB.countDocuments(pathObj);
			let objects = await objectDB.find(pathObj, selectObj)
				.skip(skip).limit(pagesize)
				.sort(sortObj)
				.populate(populateObjs)
			let object = null;
			let len_Objs = objects.length;
			if(len_Objs > 0 && queryObj.search) {
				pathObj.code = queryObj.search.replace(/(\s*$)/g, "").replace( /^\s*/, '').toUpperCase();
				object = await objectDB.findOne(pathObj, selectObj);
				if(object && object._id) {
					let i=0;
					for(;i<len_Objs; i++) {
						if(String(objects[i]._id) === String(object._id)) break;
					}
					if(i === len_Objs) i--;
					objects.splice(i, 1);
					objects = [object, ...objects];
				}
			}
			return resolve({status: 200, message: '[server] 成功读取', data: {count, page, pagesize, object, objects}, parameter: {pathObj, sortObj}});
		} catch(error) {
			console.log("/dbs", error);
			return resolve({status: 500, message: "[服务器错误: GetDB.dbs]"});
		}
	})
}