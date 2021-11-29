// 总公司管理者以上级别可以修改

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const Float = require('mongoose-float').loadType(mongoose, 2);

const colection = 'Shop';
const dbSchema = new Schema({
	code: String,									// 店铺编号
	nome: String,									// 店铺名称
	addr: String,									// 店铺地址
	zip: String,									// 店铺所属地址邮编

	img_url: String,								// 店铺logo

	Cita: {type: ObjectId, ref: 'Cita'},			// 所属城市	如果更换 需要检查服务城市列表是否有此城市
	price_ship: {type: Float, default: 0},			// 本地运费
	serve_Citas: [{									// 服务区
		Cita: {type: ObjectId, ref: 'Cita'},			// 服务城市
		price_ship: {type: Float, default: 0},			// 额外运费, 如果无则为0 
	}],

	is_main: {type: Boolean, default: false},	// 是否为公司主店
	is_boutique: {type: Boolean, default: false},	// 是否为精品店
	is_usable: { type: Boolean, default: true },	// 是否可用
	sort: Number,									// 排序

	User_upd: {type: ObjectId, ref: 'User'},		// 自动
	User_crt: {type: ObjectId, ref: 'User'},		// 只读
	at_upd: Date,									// 最近更新时间	自动
	at_crt: Date,									// 创建时间		只读
	Firm: {type: ObjectId, ref: 'Firm'},			// 所属公司		只读
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