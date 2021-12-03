const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const colection = 'User';
const dbSchema = new Schema({
	phonePre: String,
	phoneNum: String,
	phone: String, 									// [只读 绝对]
	email: String, 
	code: String,									// 用户账户
	pwd: String, 									// md5 加密

	role: Number, 									// 用户角色 // ConfUser 

	nome: String,

	Lang: {type: ObjectId, ref:"Lang"},

	is_usable: { type: Boolean, default: true },

	sort: Number,

	Shop: {type: ObjectId, ref: 'Shop'},

	User_upd: {type: ObjectId, ref: 'User'},		// 自动
	User_crt: {type: ObjectId, ref: 'User'},		// 只读

	at_upd: Date,
	at_crt: Date,									// 只读
	at_last_login: Date,							// 只读
	Firm: {type: ObjectId, ref: 'Firm'},			// 只读
	refreshToken: String,							// 只读
});

dbSchema.pre('save', function(next) {
	if(this.isNew) {
		if(!this.sort) this.sort = 0;
		this.at_upd = this.at_crt = this.at_last_login = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	this.phone = (this.phonePre && this.phoneNum) ? (String(this.phonePre) + String(this.phoneNum)) : '';

	next();
});

module.exports = mongoose.model(colection, dbSchema);