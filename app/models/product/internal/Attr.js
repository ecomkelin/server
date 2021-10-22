// Prod Sku
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;
const Float = require('mongoose-float').loadType(mongoose, 2);

const colection = 'Attr';
const dbSchema = new Schema({
	Prod: {type: ObjectId, ref: 'Prod'},

	nome: String,
	options: [String],

	langs: [{
		Lang: {type: ObjectId, ref: 'Lang'},	// 如果为空 则为默认值
		desp: String, 							// 描述
	}],

	sort: {type: Number, default: 0},

	Firm: {type: ObjectId, ref: 'Firm'},		// 只读
	User_crt: {type: ObjectId, ref: 'User'},	// 只读
	User_upd: {type: ObjectId, ref: 'User'},	// 自动
	at_crt: Date,								// 只读
	at_upd: Date,								// 自动
});
dbSchema.pre('save', function(next) {
	if(this.isNew) {
		this.at_upd = this.at_crt = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	next();
})

module.exports = mongoose.model(colection, dbSchema);