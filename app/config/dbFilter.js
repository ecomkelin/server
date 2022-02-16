const ConfUser = require('./ConfUser.js');
const MdFilter = require('../middle/middleFilter');

exports.limitSelect = (dbName, payload) => {
	if(!dbName) return [];

	if(dbName === 'User') return ['refreshToken', 'pwd'];

	if(dbName === 'Shop') {
		if(!payload.role) return ['strip', 'User_upd', 'User_crt', 'at_upd'];
		if(payload.role != ConfUser.role_set.boss) return ['strip'];
		return [];
	}

	return [];
}

exports.limitPopulate = (popStr, payload, dbName) => {
	try{
		if(!popStr) return null;	// 如果 字符串 为空 则返回空
		const populate = JSON.parse(popStr);	// 获取 populate 对象
		if(dbName === 'Prod') {
			console.log('--------------limitPopulate-----------------')
			console.log('init', populate)
		}
		recursivePop(populate, payload, dbName);		// 根据回调 筛选去掉不可返回的populate 中的 select
		console.log("rt")
		if(dbName === 'Prod') {
			console.log('return', populate)
			console.log('===========limitPopulate=============')
		}
		return populate;
	} catch(e) {
		return null;				// 如果错误(主要是 JSON.parse 的错误) 则返回空
	}
}
const recursivePop = (pops, payload, dbName) => {
	if(dbName == 'Prod') console.log("recursivePop pops", pops);
	if(pops instanceof Array) {	// 如果此 populate 是数组 则按数组对待
		console.log('recursivePop 1')
		for(let i=0; i<pops.length; i++) {
			console.log(i,'path----', pops[i].path)
			limitFilter(pops[i], payload, dbName);
			console.log(pops)
		}
	} else {	// 如果是一个对象 则按对象对待
		console.log('recursivePop 2')
		limitFilter(pops, payload, dbName);
	}
}
const limitFilter = (pop, payload, dbName) => {
	console.log('limitFilter path', pop.path)
	if(!pop.path) {	// 如果此对象下没有 path 则为其设置一个 path值 此path值不能在数据库名字 , 并且完成了
		console.log('limitFilter 1')
		pop.path = 'null';
	} else {	// 如果有 path 值 
		console.log('limitFilter 2')
		if(!pop.select) {	// 如果 没有 select 则为其设置基础值
			console.log('limitFilter 21')
			pop.select = '_id code nome';
		} else {	// 否则 进行筛选
			console.log('limitFilter 22')
			const limSels = this.limitSelect(pop.path, payload);	// 查看这个数据库中 是否有限制的字段
			console.log('fields', fields)
			if(limSels.length !== 0) {		// 如果有限制字段 则根据限制 设置select的值
				const fields = MdFilter.getArrayFromString(pop.select, ' ');
				const sels = MdFilter.ArrayDelArr(fields, limSels);
				console.log('sels', sels)
				pop.select = sels.join(' ');
			}
		}
		if(pop.populate) recursivePop(pop.populate, payload, dbName);
	}
}


exports.sortDBs = (dbName) => {
	let sortObj = null;
	if(!dbName) return sortObj;
	if(dbName === 'User') {
		sortObj = {Shop: 1, role: 1, is_usable: -1, sort: -1, at_upd: -1, code: 1, nome: 1 };
	} else if(dbName === 'Order') {
		sortObj = {at_crt: -1 };
	}
	return sortObj;
}