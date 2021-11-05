const StintUser = require('../config/StintUser.js');
const dbFilter = require('../config/dbFilter.js');

const bcrypt = require('bcryptjs');

const { ObjectId } = require('mongoose').Types;
exports.is_ObjectId_Func = id => ObjectId.isValid(id);
exports.is_ArrObjectId_Func = (arrs) => {
	if(!arrs || arrs.length == 0) return false;
	let i=0
	for(; i<arrs.length; i++) {
		if(!ObjectId.isValid(arrs[i])) break;
	}
	return (i == arrs.length) ? true : false;
}

exports.encrypt_tProm = (pwd) => {
	return new Promise((resolve, reject) => {
		if(!pwd) reject('请您输入密码');

		bcrypt.genSalt(parseInt(process.env.SALT_WORK_FACTOR), function(err, salt) {
			if(err) {
				console.log("encrypt_tProm genSalt", err);
				reject('bcrypt.genSalt error!');
			} else {
				bcrypt.hash(pwd, salt, function(err, pwd) {
					if(err) {
						console.log("encrypt_tProm hash", err);
						reject('bcrypt.hash error!');
					} else {
						resolve(pwd);
					}
				});
			}
		});
	})
}

exports.bcrypt_match_Prom = (pwd, pwd_Bcrypt) => {
	return new Promise(async(resolve) => {
		try {
			if(!pwd) pwd = ' ';
			const isMatch = await bcrypt.compare(pwd, pwd_Bcrypt);
			if(!isMatch) return resolve({status: 400, message: "原密码错误, 请重新操作" });
			return resolve({status: 200});
		} catch (error) {
			console.log("bcrypt_match_Prom", error);
			return resolve({status: 400, message: "bcrypt_match_Prom error" });
		}
	})
}

exports.jsonError = (res, errorInfo) => {
	console.log(errorInfo);
	res.json({status: 400, message: `[server] ${errorInfo}`});
}

exports.Stint_Match_objs = (Stint_obj, obj, fields) => {
	if(!Stint_obj) return 'Stint_Match_objs 请传递正确的参数 Stint_obj';
	if(!obj) return 'Stint_Match_objs 请传递正确的参数 obj';
	if(!(fields instanceof Array)) return 'Stint_Match_objs 请传递正确的参数 fields';

	for(let i=0; i<fields.length; i++) {
		const field = fields[i];
		const Stint_field = Stint_obj[field];
		let data = obj[field];
		if(!Stint_field) return 'Stint_Match_objs 请传递正确的 Stint_field 参数';

		if(!data) return Stint_field.errMsg.nullMsg;
		data = data.replace(/^\s*/g,"");
		if(!data) return Stint_field.errMsg.nullMsg;
		if(Stint_field.regexp) {
			const regexp = new RegExp(Stint_field.regexp);
			if(!regexp.test(data)) return Stint_field.errMsg.regexpMsg;
		}
		if(Stint_field.trim && Stint_field.trim !== data.length) return Stint_field.errMsg.trimMsg+Stint_field.trim;

		if(Stint_field.min && Stint_field.min > data.length) return Stint_field.errMsg.minMsg+Stint_field.min;

		if(Stint_field.max &&  Stint_field.max < data.length) return Stint_field.errMsg.maxMsg+Stint_field.max;
	}
	return null;
}


exports.path_Func = (queryObj) => {
	const pathObj = {};
	if(queryObj.search) {
		const search = new RegExp(String(queryObj.search).replace(/(\s*$)/g, "").replace( /^\s*/, '').toUpperCase() + '.*');
		pathObj["$or"] = [{'code': search}, {'nome': { $regex: search, $options: '$i' }}];
	}
	if(queryObj.is_usable) {	// 特殊情况 要在各自的文件处理
		(queryObj.is_usable == 0 || queryObj.is_usable == "false") ? (is_usable = 0) : (is_usable = 1)
		pathObj["is_usable"] = {'$eq': is_usable};
	}
	if(queryObj.includes) {
		const ids = this.getArray_ObjectId_Func(queryObj.includes);
		pathObj["_id"] = {'$in': ids};
	}
	if(queryObj.excludes) {
		const ids = this.getArray_ObjectId_Func(queryObj.excludes);
		pathObj["_id"] = {'$nin': ids};
	}

	if(this.is_ObjectId_Func(queryObj.User_crt)) pathObj["User_crt"] = queryObj.User_crt;
	if(this.is_ObjectId_Func(queryObj.User_upd)) pathObj["User_upd"] = queryObj.User_upd;

	if(queryObj.crt_after ) {
		let crt_after = new Date(queryObj.crt_after).setHours(0,0,0,0);
		if(!isNaN(crt_after)) {
			(pathObj["at_crt"]) ? (pathObj["at_crt"]["$gte"] = crt_after) : (pathObj["at_crt"] = {"$gte": crt_after})
		}
		// crt_after = new Date(crt_after)
		// console.log('crt_after', crt_after)
	}
	if(queryObj.crt_before) {
		let crt_before = (new Date(queryObj.crt_before).setHours(23,59,59,999));
		if(!isNaN(crt_before)) {
			(pathObj["at_crt"]) ? (pathObj["at_crt"]["$lte"] = crt_before) : (pathObj["at_crt"] = {"$lte": crt_before+24*60*60*1000})
		}
		// crt_before = new Date(crt_before)
		// console.log('crt_before', crt_before)
	}

	if(queryObj.upd_after ) {
		let upd_after = new Date(queryObj.upd_after).setHours(0,0,0,0);
		if(!isNaN(upd_after)) {
			(pathObj["at_upd"]) ? (pathObj["at_upd"]["$gte"] = upd_after) : (pathObj["at_upd"] = {"$gte": upd_after})
		}
	}
	if(queryObj.upd_before) {
		let upd_before = (new Date(queryObj.upd_before).setHours(23,59,59,999));
		if(!isNaN(upd_before)) {
			(pathObj["at_upd"]) ? (pathObj["at_upd"]["$lte"] = upd_before) : (pathObj["at_upd"] = {"$lte": upd_before+24*60*60*1000})
		}
	}

	if(queryObj.sort_gte) {
		const sort_gte = parseInt(queryObj.sort_gte);
		if(!isNaN(sort_gte)) {
			pathObj["sort"] ? (pathObj["sort"]["$gte"] = sort_gte) : (pathObj["sort"] = {"$gte": sort_gte});
		}
	}
	if(queryObj.sort_lte) {
		const sort_lte = parseInt(queryObj.sort_lte);
		if(!isNaN(sort_lte)) {
			(pathObj["sort"])? (pathObj["sort"]["$lte"] = sort_lte) : (pathObj["sort"] = {"$lte": sort_lte});
		}
	}

	return pathObj;
}

// mongodb 中的 select 限制 字段
exports.select_func = (selectKeys, selectVal, dbName, payload) => {
	const sel = dbFilter.limitSelect(dbName, payload)

	const keys = this.getArrayFromString(selectKeys);

	const selectObj = {};
	selectVal = parseInt(selectVal);
	selectVal = (selectVal === 1)? 1: 0;

	if(selectVal === 0) {
		sel.forEach(item => selectObj[item] = 0);
		keys.forEach(item => selectObj[item] = 0);
	} else {
		keys.forEach(item => {
			if(!sel.includes(item)) selectObj[item] = 1;
		});
	}
	return selectObj;
}

// mongodb 中的 find 中 字段排序
exports.sort_Func = (sortKey, sortVal, dbName) => {
	let sortObj = dbFilter.sortDBs(dbName);
	if(!sortObj) sortObj = {is_usable: -1, sort: -1, at_upd: -1, code: 1, nome: 1 };

	if(sortKey && (sortVal === 1 || sortVal === -1) ) sortObj = {[sortKey]: '', ...sortObj, [sortKey]: sortVal};

	return sortObj;
}


exports.page_Func = (page, pagesize) => {
	page = parseInt(page);
	if(isNaN(page) || page<1) page=1;

	pagesize = parseInt(pagesize);
	if(isNaN(pagesize) || pagesize<1) pagesize=50;

	const skip = (page-1)*pagesize;
	return {page, pagesize, skip};
}


// 根据所给字符串 转化为 数组
exports.getArrayFromString = (strData, symb=',') => {
	const arrs = [];
	if(!strData || strData === 'null' || strData == 'undefined') return arrs;
	strData = String(strData).replace(/(\s*$)/g, "").replace( /^\s*/, "");								// 去字符 前后空格
	if(!strData) return arrs;
	if(strData[0] === '[' && strData[strData.length-1] === ']') strData = strData.substr(1,strData.length-2); // 去字符 []
	if(!strData) return arrs;
	if(symb === ',') {
		strData = strData.replace(/，/g,",");						// 如果是以逗号区分 则把中文逗号 改编为 英文逗号
	}
 	const keys = strData.split(symb);																		// 拆分
	keys.forEach(key => {
		key = key.replace(/(\s*$)/g, "").replace( /^\s*/, "");								// 去字符 前后空格
		if(key[0] === '"' && key[key.length-1] === '"') key = key.substr(1,key.length-2); 	// 去字符 "
		if(key[0] === "'" && key[key.length-1] === "'") key = key.substr(1,key.length-2); 	// 去字符 '
		if(key && key.length > 0) {
			if(key === 'false') key = false; 
			else if(key === 'true') key = true;
			arrs.push(key);
		}
	})
	return arrs;
}


// 根据所给字符串 转化为 _id 数组
exports.getArray_ObjectId_Func = (strData) => {
	const arrs = this.getArrayFromString(strData);
	const ids = [];
	for(let i=0; i<arrs.length; i++) {
		if(this.is_ObjectId_Func(arrs[i])) ids.push(arrs[i]);
	}
	return ids;
}

// 从 数组中 删除temps中包含的所有元素
exports.ArrayDelArr = (arrays, temps) => {
	if(!(arrays instanceof Array)) return [];
	if(!(temps instanceof Array)) return arrays;
	const arrs = [];
	arrays.forEach(arr => {
		if(!temps.includes(arr)) arrs.push(arr);
	})
	return arrs;
}
// 数组是否 包含 此字符串 并且返回 所在位置
exports.indexArr_Func = (arrs, str) => {
	if(!(arrs instanceof Array)) return -2;
	return arrs.indexOf(str);
}
// 对象数组中的某一字段 是否包含此 字符串
exports.indexArrObj_Func = (arrs, field, str) => {
	if(!(arrs instanceof Array)) return -2;
	let index=0;
	for(;index<arrs.length; index++) {
		if(String(arrs[index][field]) == String(str)) break;
	}
	if(index == arrs.length) return -1;
	return index-1;
}

// 字符串数组 中的所有字符串 转大写字母
exports.Arr_toUpper_Func = (arrs) => {
	if(!arrs) return null;
	for(let i=0;i<arrs.length;i++){
		arrs[i]= arrs[i].toUpperCase();
	}
	return arrs;
}

exports.readonly_Func = (obj) => {
	delete obj.Firm;
	delete obj.at_crt;
	delete obj.User_crt;
}

// setLink 去掉字符串数组中重复的元素
exports.setArrays_Func = (arrs) => {
	if(!arrs) return false;
	const attrs = [];
	for(let i=0; i<arrs.length; i++) {
		if(!attrs.includes(arrs[i])) attrs.push(arrs[i]);
	}
	return attrs;
}
// 如果两个字符串数组完全相同 则为真
exports.matchArrayAbs_Func = (arrays, arrs) => {
	if(arrays.length !== arrs.length) return false;
	for(let i=0; i<arrs.length; i++) {
		if(arrays[i] != arrs[i]) return false;
	}
	return true;
}

exports.get_phonePre_Func = (phonePre) => {
	if(!phonePre) return false;
	phonePre = String(phonePre);
	if(phonePre.length === 2) {
		if(isNaN(parseInt(phonePre[0])) ) return false;
		if(isNaN(parseInt(phonePre[1])) ) return false;
		return "+"+phonePre[0]+phonePre[1];
	} else if(phonePre.length === 3) {
		if(phonePre[0] !== "+") return false;
		if(isNaN(parseInt(phonePre[1])) ) return false;
		if(isNaN(parseInt(phonePre[2])) ) return false;
		return phonePre;
	} else if(phonePre.length === 4) {
		if(phonePre[0] !== "0") return false;
		if(phonePre[1] !== "0") return false;
		if(isNaN(parseInt(phonePre[2])) ) return false;
		if(isNaN(parseInt(phonePre[3])) ) return false;
		return "+"+phonePre[2]+phonePre[3];
	}
	return false;
}