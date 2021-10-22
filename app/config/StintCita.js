module.exports = {
	code: {regexp: '^[a-zA-Z0-9]*$', trim: 2, errMsg: {
		nullMsg: '城市编号不能为空',
		regexpMsg: '城市编号只能由字母或数字组成',
		trimMsg: '城市编号的长度只能为: ',
	}},
	nome: {min: 3, max: 20, errMsg: {
		nullMsg: '城市名称不能为空',
		minMsg: '城市名称的位数不能小于: ',
		maxMsg: '城市名称的位数不能大于: '
	}}
}