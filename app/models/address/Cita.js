const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const colection = 'Cita';
const dbSchema = new Schema({
	code: {			// 城市简称 MI TO FR
		type: String,
		required: true,
		unique: true,
	},
	nome: String,
	img_url: String,
	langs: [{
		Lang: {type: ObjectId, ref: 'Lang'},	// 如果为空 则为默认值
		desp: String,
	}],

	Area: {type: ObjectId, ref: "Area"}, // 所属大区

	is_usable: { type: Boolean, default: true },
	sort: {type: Number, default: 0}
});

module.exports = mongoose.model(colection, dbSchema);