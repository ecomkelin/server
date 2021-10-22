const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const colection = 'Firm';
const dbSchema = new Schema({
	code: String,
	nome: String,

	resp: String,
	tel: String,
	addr: String,

	is_usable: { type: Boolean, default: true },

	sort: Number,
	at_crt: Date,
	at_upd: Date,
});

dbSchema.pre('save', function(next) {
	if(this.isNew) {
		if(!this.sort) this.sort = 0;
		this.at_upd = this.at_crt = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	next();
})

module.exports = mongoose.model(colection, dbSchema);