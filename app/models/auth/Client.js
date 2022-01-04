const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const colection = 'Client';
const dbSchema = new Schema({
	code: String,										// 只读 如果后续做code可修改, code字符串中不得有 Conf 中的月份字母
	is_changed: {type: Boolean, default: false}, 		// 只读 如果账号被修改过 则为 true 否则为 false
	at_last_codeUpd: Date,								// 只读 上次账户修改时间

	email: String,										// opt 管理

	phonePre: String,
	phoneNum: String,
	phone: String,										// [只读 绝对]

	pwd: String, 										// md5 加密

	socials:[{											// 已绑定的社交账号
		social_type: String,							// enum: ["facebook", "google", "wx", "tiktok"]
		social_id: String,
	}],

	nome: String,

	type_paid: Number,									// 默认支付方式 为客户自动选择支付方式
	Lang: {type: ObjectId, ref:"Lang"},

	addrs: [{
		Cita: {type: ObjectId, ref: "Cita"},

		name: String,
		// company: String,
		address: String,
		postcode: String,
		phone: String,
		note: String,
	}],

	is_active: Boolean, 								// 只读
	is_usable: { type: Boolean, default: true },		// 平台管理员
	sort: {type: Number, default: 0},					// 平台管理员
	refreshToken: String,								// 只读
	at_upd: Date,										// 只读
	at_crt: Date,										// 只读
	at_last_login: Date,								// 只读
});

dbSchema.pre('save', function(next) {
	if(this.isNew) {
		if(!this.sort) this.sort = 0;
		this.at_upd = this.at_crt = this.at_last_login = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	console.log("phonePre", this.phonePre)
	console.log("phoneNum", this.phoneNum)
	this.phone = (this.phonePre && this.phoneNum) ? (String(this.phonePre) + String(this.phoneNum)) : '';
	console.log("phone", this.phone)

	this.is_active = (!this.email && !this.phone) ? false : true;
	next();
});

module.exports = mongoose.model(colection, dbSchema);