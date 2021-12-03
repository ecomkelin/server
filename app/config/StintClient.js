module.exports = {
	phonePre: {regexp: '^[0-9]*$', trim: 4, errMsg: {
		nullMsg: '电话号码前缀不能为空',
		regexpMsg: '电话号码前缀只能由数字组成',
		trimMsg: '电话号码前缀长度只能为: ',
	}},

	phoneNum: {regexp: '^[0-9]*$', trim: 10, errMsg: {
		nullMsg: '电话号码不能为空',
		regexpMsg: '电话号码只能由数字组成',
		trimMsg: '电话号码的长度只能为: ',
	}},

	code: {regexp: '^[a-zA-Z0-9]*$', min: 4, max: 20, errMsg: {
		nullMsg: '成员账号不能为空',
		regexpMsg: '成员账号只能由数字和字母组成',
		minMsg: '成员账号的位数不能小于: ',
		maxMsg: '成员账号的位数不能大于: '
	}},
	pwd: {min: 6, max: 12, errMsg: {
		nullMsg: '密码不能为空',
		minMsg: '密码的位数不能小于: ',
		maxMsg: '密码的位数不能大于: '
	}},
}