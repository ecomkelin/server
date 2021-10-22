// Sku
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;
const Float = require('mongoose-float').loadType(mongoose, 2);

const colection = 'Batch';
const dbSchema = new Schema({
	Pd: {type: ObjectId, ref: 'Pd'},
	Prod: {type: ObjectId, ref: 'Prod'},
	Sku: {type: ObjectId, ref: 'Sku'},

	quantity: Number,

	at_pur: Date,

	at_exp: Date,
});

module.exports = mongoose.model(colection, dbSchema);