const StintClient = require('./StintClient.js');
const StintFirm = require('./StintFirm.js');
const StintShop = require('./StintShop.js');
const StintUser = require('./StintUser.js');
const StintPd = require('./StintPd.js');
const StintAttr = require('./StintAttr.js');
const StintCateg = require('./StintCateg.js');
const StintBrand = require('./StintBrand.js');

module.exports = {
	Client: StintClient,
	Firm: StintFirm,
	Shop: StintShop,
	User: StintUser,
	Pd: StintPd,
	Attr: StintAttr,
	Categ: StintCateg,
	Brand: StintBrand,

	Nation: {
		code: {regexp: '^[a-zA-Z]*$', trim: 2, errMsg: {
			nullMsg: '国家编号不能为空',
			regexpMsg: '国家编号只能由字母组成',
			trimMsg: '国家编号的的长度只能为: '
		}},
		nome: {min: 2, max: 15, errMsg: {
			nullMsg: '国家名称不能为空',
			minMsg: '国家名称的位数不能小于: ',
			maxMsg: '国家名称的位数不能大于: '
		}},
		tel: {trim: 4, errMsg: {
			nullMsg: '国家区号不能为空',
			trimMsg: '国家区号的的长度只能为: '
		}}
	},
	Area: {
		code: {regexp: '^[a-zA-Z]*$', trim: 3, errMsg: {
			nullMsg: '大区编号不能为空',
			regexpMsg: '大区编号只能由字母组成',
			trimMsg: '大区编号的的长度只能为: '
		}},
		nome: {min: 2, max: 25, errMsg: {
			nullMsg: '大区名称不能为空',
			minMsg: '大区名称的位数不能小于: ',
			maxMsg: '大区名称的位数不能大于: '
		}}
	},
	Cita: {
		code: {regexp: '^[a-zA-Z]*$', trim: 2, errMsg: {
			nullMsg: '城市编号不能为空',
			regexpMsg: '城市编号只能由字母组成',
			trimMsg: '城市编号的的长度只能为: '
		}},
		nome: {min: 2, max: 15, errMsg: {
			nullMsg: '城市名称不能为空',
			minMsg: '城市名称的位数不能小于: ',
			maxMsg: '城市名称的位数不能大于: '
		}}
	},
};