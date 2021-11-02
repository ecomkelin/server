module.exports = {
	code: {regexp: '^[0-9]*$', min: 3, max: 25, errMsg: {
		nullMsg: '产品条形码不能为空',
		regexpMsg: '产品条形码只能由数字组成',
		minMsg: '产品条形码的位数不能小于: ',
		maxMsg: '产品条形码的位数不能大于: '
	}},
	nome: {min: 2, max: 25, errMsg: {
		nullMsg: '产品名称不能为空',
		minMsg: '产品名称的位数不能小于: ',
		maxMsg: '产品名称的位数不能大于: '
	}}
}