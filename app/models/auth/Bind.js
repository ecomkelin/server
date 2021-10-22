const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const colection = 'Bind';
const dbSchema = new Schema({

	Client: {type: ObjectId, ref: "Client"},
	Firm: {type: ObjectId, ref: "Firm"},
	Shops: [{type: ObjectId, ref: "Shop"}],

	// Firm 控制
	is_usable: { type: Boolean, default: true },		// 如果禁用相当于把此用户加入黑名单
	vip: Number, 										// 用户 VIP
	sort_Client: Number,

	// Client 控制
	sort_Firm: Number,

	at_upd: Date,										// 只读
	at_crt: Date,										// 只读

});

dbSchema.pre('save', function(next) {
	if(this.isNew) {
		if(!this.sort) this.sort = 0;
		this.at_upd = this.at_crt = this.at_last_login = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	next();
});

module.exports = mongoose.model(colection, dbSchema);