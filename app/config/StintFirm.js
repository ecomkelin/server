module.exports = {
	code: {regexp: '^[a-zA-Z]*$', min: 2, max: 8, errMsg: {
		nullMsg: '公司编号不能为空',
		regexpMsg: '公司编号只能由字母组成',
		minMsg: '公司编号的位数不能小于: ',
		maxMsg: '公司编号的位数不能大于: '
	}},

	nome: {min: 2, max: 15, errMsg: {
		nullMsg: '公司名称不能为空',
		minMsg: '公司名称的位数不能小于: ',
		maxMsg: '公司名称的位数不能大于: '
	}}
}