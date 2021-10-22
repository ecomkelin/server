module.exports = {
	code: {regexp: '^[a-zA-Z0-9]*$', trim: 2, errMsg: {
		nullMsg: '国家编号不能为空',
		regexpMsg: '国家编号只能由字母或数字组成',
		trimMsg: '国家编号的长度只能为: ',
	}},
	nome: {min: 3, max: 20, errMsg: {
		nullMsg: '国家名称不能为空',
		minMsg: '国家名称的位数不能小于: ',
		maxMsg: '国家名称的位数不能大于: '
	}}
}