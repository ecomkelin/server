const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const colection = 'Lang';
const dbSchema = new Schema({
	
	code: {					// 国家编码 IT CN EN
		type: Number,
		required: true,
		unique: true,
		uppercase: true,
		trim: true,
		match: '^[A-Z]*$',
		minLength: 2,
		maxLength: 2
	},
	img_url: String,

	langs: [{
		Lang: {type: ObjectId, ref: 'Lang'},	// 如果为空 则为默认值
		nome: String, 							// 中文 English Italiano
	}],

	sort: Number,
	Firm: {type: ObjectId, ref: 'Firm'},
	at_crt: Date,
	at_upd: Date,
});
dbSchema.pre('save', function(next) {
	if(this.isNew) {
		this.at_upd = this.at_crt = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	next();
});

module.exports = mongoose.model(colection, dbSchema);