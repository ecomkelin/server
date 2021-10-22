const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;
const Float = require('mongoose-float').loadType(mongoose, 2);

const colection = 'Record';
const dbSchema = new Schema({
	Pd: {type: ObjectId, ref: 'Pd'},
	Prod: {type: ObjectId, ref: 'Prod'},
	Sku: {type: ObjectId, ref: 'Sku'},

	type_Order: Number, // enum: [1, -1],	1: 采购 -1: 出售
	Order: {type: ObjectId, ref: 'Order'},
	Orditem: {type: ObjectId, ref: "Ordtm"},

	quantity: Number,

	note: String,

	at_crt: Date,
});

module.exports = mongoose.model(colection, dbSchema);