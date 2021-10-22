const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const colection = 'Ader';
const dbSchema = new Schema({
	code: {
		unique: true,
		type: String
	},
	pwd: String,
});

module.exports = mongoose.model(colection, dbSchema);