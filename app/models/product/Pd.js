// 公司产品库

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;
const Float = require('mongoose-float').loadType(mongoose, 2);

const colection = 'Pd';
const dbSchema = new Schema({
	/* 强制 完全相同 */
	code: String, 								// 条形号码
	nome: String,								// 产品名称
	img_urls: [String], 						// imgs
	Brand: {type: ObjectId, ref: 'Brand'},
	Nation: {type: ObjectId, ref: 'Nation'},

	Categ: {type: ObjectId, ref: 'Categ'},

	/* 同步 可修改 */
	desp: String,
	unit: String,								// 单位
	langs: [{
		Lang: {type: ObjectId, ref: 'Lang'},	// 如果为空 则为默认值
		nome: String,
		desp: String, 							// 描述
		unit: String,							// 单位
	}],
	// Tags: [{type: ObjectId, ref: 'Tag'}],
	sort: Number,
	price_regular: Float,							// 默认标价 默认Sku 一般同步此价格
	price_sale: Float,								// 建议售价 默认Sku 一般同步此价格
	is_fixPrice: { type: Boolean, default: false },	// 价格是否固定 如果是否则分店是可以更改价格

	is_usable: { type: Boolean, default: true },	// 只是不能被同步, 已经被同步的商品 不受此字段影响

	/* 只读 */
	Prods: [{type: ObjectId, ref: "Prod"}],
	num_likes: {type: Number, default: 0},		// 只读 为之后分析公司产品预留
	num_unlikes: {type: Number, default: 0},	// 只读 为之后分析公司产品预留

	/* 自动生成 */
	Firm: {type: ObjectId, ref: 'Firm'},		// 只读
	User_crt: {type: ObjectId, ref: 'User'},	// 只读
	User_upd: {type: ObjectId, ref: 'User'},	// 自动
	at_crt: Date,								// 只读
	at_upd: Date,								// 自动
});

dbSchema.pre('save', function(next) {
	if(this.isNew) {
		this.num_likes = 0;
		this.num_unlikes = 0;
		if(!this.sort) this.sort = 0;
		if(!this.price_regular) this.price_regular = 0;
		this.at_upd = this.at_crt = Date.now();
	} else {
		this.at_upd = Date.now();
	}
	if(this.price_sale >= this.price_regular) this.price_sale = this.price_regular;
	next();
})

module.exports = mongoose.model(colection, dbSchema);