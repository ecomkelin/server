const GetDB = require('../../_db/GetDB');
const ConfOrder = require('../../../config/ConfOrder.js');
const StintClient = require('../../../config/StintClient.js');
const MdFilter = require('../../../middle/middleFilter');

const ClientDB = require('../../../models/auth/Client');
const CitaDB = require('../../../models/address/Cita');

const _ = require('underscore');

const dbClient = 'Client';
exports.vClient = async(req, res) => {
	console.log("/v1/Client");
	try {
		const curClient = req.curClient;
		const GetDB_Filter = {
			id: curClient._id,
			Identity: curClient,
			queryObj: req.query,
			objectDB: ClientDB,
			path_Callback: null,
			dbName: dbClient,
		};
		const db_res = await GetDB.db(GetDB_Filter);
		// console.log(db_res.data.object)
		// console.log(db_res.data.object.addrs)
		return res.status(db_res.status).json(db_res);
	} catch(error) {
		console.log("/v1/Client", error);
		return res.status(500).json({status: 500, message: "[服务器错误: vClient]"});
	}
}

exports.vClientPut = async(req, res) => {
	console.log("/v1/ClientPut");
	try{
		const curClient = req.curClient;

		const pathObj = {_id: curClient._id};

		const Client = await ClientDB.findOne(pathObj);
		if(!Client) return res.json({status: 400, message: "[server] 没有找到此用户信息, 请刷新重试"});
		// console.log(req.body)
		// console.log('Client', Client)
		if(req.body.code) {
			return res.json({status: 400, message: "更改账号功能 暂不开放"});
			let code = req.body.code;
			if(code !== Client.code) {
				code = code.replace(/^\s*/g,"").toUpperCase();
				const errorInfo = MdFilter.Stint_Match_Func(code, StintClient.code);
				if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});

				const objSame = await ClientDB.findOne({_id: {$ne: Client._id}, code})
				if(objSame) return res.json({status: 400, message: '[server] 此用户账户已被占用, 请查看'});

				Client.code = code;
			} else {
				return res.json({status: 400, message: '[server] 如果您需要修改账户, 请输入与原账户不同的账户'});
			}
		} else if(req.body.password) {
			const password = req.body.password;
			// console.log('password', password)
			if(!password.pwd) return res.json({status: 400, message: "[server] 请输入新密码"});
			const pwd = password.pwd.replace(/(\s*$)/g, "").replace( /^\s*/, '');
			// console.log('pwd', pwd)
			const errorInfo = MdFilter.Stint_Match_Func(pwd, StintClient.pwd);
			// console.log("errorInfo", errorInfo)
			if(errorInfo) return res.json({status: 400, message: '[server] '+errorInfo});
			if(!password.pwdOrg) return res.json({status: 400, message: "[server] 请输入原密码"});
			const pwdOrg = password.pwdOrg.replace(/(\s*$)/g, "").replace( /^\s*/, '');
			// console.log("pwdOrg", pwdOrg)
			const pwd_match_res = await MdFilter.bcrypt_match_Prom(pwdOrg, Client.pwd);
			// console.log("pwd_match_res", pwd_match_res)
			if(pwd_match_res.status !== 200) return res.json({status: 400, message: "[server] 原密码错误，请重新操作"});
			// console.log('200')
			Client.pwd = await MdFilter.encrypt_tProm(pwd);
			// console.log("Client.pwd", Client.pwd)
		} else if(req.body.general) {
			const general = req.body.general;
			if(general.nome) Client.nome = general.nome.replace(/(\s*$)/g, "").replace( /^\s*/, '');
			if(general.type_paid) {
				if(!ConfOrder.type_paid_Arrs.includes(general.type_paid)) res.json({status: 400, message: '[server] 付款方式参数错误'});
				Client.type_paid = general.type_paid;
			}
		} else if(req.body.addr_post) {
			const addr = req.body.addr_post;
			delete addr._id;
			if(!(addr.name)) return res.json({status: 400, message: '[server] addr_post name不能为空'});
			if(!(addr.address)) return res.json({status: 400, message: '[server] addr_post address不能为空'});
			if(!(addr.postcode)) return res.json({status: 400, message: '[server] addr_post postcode不能为空'});
			if(!(addr.phone)) return res.json({status: 400, message: '[server] addr_post phone不能为空'});
			if(!(addr.Cita)) return res.json({status: 400, message: '[server] addr_post Cita 为 ObjectId'});
			let Cita = null;
			if(MdFilter.is_ObjectId_Func(addr.Cita)) Cita = await CitaDB.findOne({_id: addr.Cita});
			if(addr.Cita.length === 2) Cita = await CitaDB.findOne({code: addr.Cita});
			if(!Cita) return res.json({status: 400, message: '[server] 没找到此城市信息'});
			addr.Cita = Cita._id;
			if(!Client.addrs) Client.addrs = [];
			Client.addrs.push(addr);
		} else if(req.body.addr_put) {
			const addr = req.body.addr_put;

			if(!(addr.name)) return res.json({status: 400, message: '[server] addr_post name不能为空'});
			if(!(addr.address)) return res.json({status: 400, message: '[server] addr_post address不能为空'});
			if(!(addr.postcode)) return res.json({status: 400, message: '[server] addr_post postcode不能为空'});
			if(!(addr.phone)) return res.json({status: 400, message: '[server] addr_post phone不能为空'});
			if(!(addr.Cita)) return res.json({status: 400, message: '[server] addr_post Cita 为 ObjectId'});
			let Cita = null;
			if(MdFilter.is_ObjectId_Func(addr.Cita)) Cita = await CitaDB.findOne({_id: addr.Cita});
			if(addr.Cita.length === 2) Cita = await CitaDB.findOne({code: addr.Cita});
			if(!Cita) return res.json({status: 400, message: '[server] 没找到此城市信息'});
			addr.Cita = Cita._id;

			for(let i=0; i<Client.addrs.length; i++) {
				if(String(Client.addrs[i]._id) === addr._id) {
					Client.addrs[i] = addr;
					break;
				}
			}
		} else if(req.body.addr_sort) {
			const addr_sort = req.body.addr_sort;

			let numTh = 0;
			if(addr_sort.numTh && !isNaN(parseInt(addr_sort.numTh))) numTh = parseInt(addr_sort.numTh) - 1;
			if(numTh < 0) numTh = 0;

			let i=0;
			for(; i<Client.addrs.length; i++) {
				if(String(Client.addrs[i]._id) === addr_sort._id) break;
			}
			if(i !== Client.addrs.length) {
				const addr = {...Client.addrs[i]};
				Client.addrs.splice(i, 1);
				Client.addrs.splice(numTh, 0, addr);
			}
		} else if(req.body.addr_del) {
			const id = req.body.addr_del.addrId;
			let i=0;
			for(; i<Client.addrs.length; i++) {
				if(String(Client.addrs[i]._id) === id) break;
			}
			if(i === Client.addrs.length) return res.status(200).json({status: 200, message: '[server] 没有找到此 id'});
			if(i !== Client.addrs.length) Client.addrs.splice(i, 1);
		} else {
			return res.json({status: 400, message: '[server] 请查看 API 输入正确的修改参数'});
		}

		const objSave = await Client.save();
		return res.status(200).json({status: 200, message: '[server] 修改成功', data: {object: objSave}});
	} catch(error) {
		console.log("/v1/ClientPut", error);
		return res.status(500).json({status: 500, message: "[服务器错误: ClientPut]"});
	}
}