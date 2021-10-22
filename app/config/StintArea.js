module.exports = {
	code: {regexp: '^[a-zA-Z0-9]*$', trim: 3, errMsg: {
		nullMsg: '大区编号不能为空',
		regexpMsg: '大区编号只能由字母或数字组成',
		trimMsg: '大区编号的长度只能为: ',
	}},
	nome: {min: 3, max: 20, errMsg: {
		nullMsg: '大区名称不能为空',
		minMsg: '大区名称的位数不能小于: ',
		maxMsg: '大区名称的位数不能大于: '
	}}
}