/user/:userId
获取用户详情

接口请求 方式 GET
权限要求
headers: {
	authorization: "accessToken",
}
用户 role  [1, 3, 90] 查看比自己权限低的成员和自己列表
第一种情况: 1， 3 可以查看所有公司的成员列表
第二种情况: 90 只可以查看本stream公司的成员列表

##响应数据
###成功时返回数据
{
	status: 200,
	message: '登录成功',
	data: {user},
}

###失败时返回数据
{status: 500, message: '系统登录错误, 请联系管理员。 错误码: loginFunc[1]'}