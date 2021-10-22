const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const colection = 'Nation';
const dbSchema = new Schema({
	code: {			// 国家简称 CN IT
		type: String,
		required: true,
		unique: true,
	},
	nome: String,
	tel: String, 		// 0039 0086
	img_url: String,
	langs: [{
		Lang: {type: ObjectId, ref: 'Lang'},	// 如果为空 则为默认值
		desp: String,
	}],

	img_url: String,

	is_usable: { type: Boolean, default: true },
	sort: Number,
});

module.exports = mongoose.model(colection, dbSchema);