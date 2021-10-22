## 基础结构:
firm: {type: ObjectId, ref: 'Firm'},	// 所属公司
stream: {type: ObjectId, ref: 'Stream'},// 所属合作方的公司

code: {type: String, required: true},	// 账号
pwd: {type: String, required: true},	// 密码 md5加密过的

role: Number,							// 角色 									// *

lang: {type: Number, default: 0},		// 语言, 暂时不用 						// *
photo: String,							// 头像, 暂时不用

nome: String,							// 名字
tel: String,							// 电话
addr: String,							// 地址

shelf: Number,							// [1, -1] 上下架 -1为下架 1为上架
logAt: Date,							// 上次登录时间
refreshToken: String,					// 刷新token
crter: {type: ObjectId, ref: 'User'},	// 创建者
crtAt: Date,							// 创建时间
updAt: Date,							// 最近更新时间

## 角色权限
roleUser: {
	owner:    {num: 1, index: '/ower', code: 'bs', val: '拥有 OWNER', },			// 入驻公司所有者
	manager:  {num: 3, index: '/mger', code: 'mg', val: '管理 Manager', },		// 公司的管理员 拥有所有者的所有权限(除了不可添加新的管理者和对其他管理者的操作)
	staff:    {num: 5, index: '/sfer', code: 'sf', val: '员工 Staff', },			// 员工 预留功能
	finance:  {num:10, index: '/fner', code: 'fn', val: '财务 Finance', },		// 财务
	brander:  {num:20, index: '/bner', code: 'bn', val: '品牌 Brander', },		// 品牌部
	promotion:{num:25, index: '/pmer', code: 'pm', val: '推广 Promotion', },		// 推广部
	order:    {num:30, index: '/oder', code: 'od', val: '订单 Order', },			// 订单部
	quotation:{num:50, index: '/qter', code: 'qt', val: '报价 Quotation', },		// 报价
	logistic: {num:70, index: '/lger', code: 'lg', val: '物流 Logistic', },		// 物流
	boss:     {num:90, index: '/bser', code: 'bs', val: '老板 BOSS', },			// 销售公司的老板
	seller:   {num:95, index: '/sler', code: 'sl', val: '销售 SELLER', },		// 销售公司的销售员
	customer: {num:99, index: '/cter', code: 'ct', val: '客户 Customer', },		// 销售公司的客户
},

## 语言
userLang: {
	cn: {num: 1, val: '中文'},
	en: {num: 2, val: 'English'},
	it: {num: 3, val: 'Italiano'},
},