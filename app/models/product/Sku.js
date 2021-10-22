const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;
const Float = require('mongoose-float').loadType(mongoose, 2);

const colection = 'Sku';
const dbSchema = new Schema({
	Pd: {type: ObjectId, ref: 'Pd'},		// 只读
	Prod: {type: ObjectId, ref: 'Prod'},	// 只读

	attrs: [{
		nome: String,
		option: String
	}],

	price_regular: Float,
	price_sale: Float,
	is_discount: Boolean, // 只读 if true 控制 Prod

	// at_fromSale: Date,
	// at_toSale: Date,

	purchase_note: String,
	limit_quantity: {type: Number, default: 0},
	Records: [{type: ObjectId, ref: 'Record'}],
	Batchs: [{type: ObjectId, ref: 'Batch'}],

	is_controlStock: {type: Boolean, default: true},

	quantity: Number,
	quantity_alert: Number,
	is_alert: Boolean, // 只读 if true 控制 Prod

	allow_backorder: {type: Boolean, default: true},

	is_usable: {type: Boolean, default: true }, 
	is_sell: Boolean, 							// 只读

	User_crt: {type: ObjectId, ref: 'User'},	// 只读
	User_upd: {type: ObjectId, ref: 'User'},	// 只读
	at_crt: Date,								// 只读
	at_upd: Date,								// 只读

	Firm: {type: ObjectId, ref: 'Firm'},		// 只读
	Shop: {type: ObjectId, ref: 'Shop'},		// 只读
});

dbSchema.pre('save', function(next) {
	if(this.isNew) {
		if(!this.sort) this.sort = 0;
		if(!this.quantity) this.quantity = 0;
		if(!this.quantity_alert) this.quantity_alert = 0;
		this.at_upd = this.at_crt = Date.now();
	}
	this.at_upd = Date.now();
	this.is_sell = this.is_usable
		? this.is_controlStock
			? this.allow_backorder
				? true
				: this.quantity > 0 ? true : false 
			: true
		: true;
	if(this.price_sale >= this.price_regular) this.price_sale = this.price_regular;
	this.is_discount = (this.price_sale < this.price_regular) ? true : false ;

	this.is_alert = (this.quantity <= this.quantity_alert) ? true : false;

	next();
})

module.exports = mongoose.model(colection, dbSchema);