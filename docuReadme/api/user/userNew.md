/userNew
添加新用户

接口请求 方式 POST
权限要求
headers: {
	authorization: "accessToken",
}
用户 role  [1, 3, 90] 查看比自己权限低的成员和自己列表
第一种情况: 1， 3 可以添加所有公司的成员列表
第二种情况: 90 只可以添加本stream公司的成员列表
接口参数
有翻页功能

| 序号	| 变量	|  类型	| 功能	|       规范			|                   限制						|                 描述					|
| -----	| -----	| -----	| ----	| -----------------	| -----------------------------------------	| -------------------------------------	|
|  1	| code	|String	| 搜索	| &code="string"	| 必须是英文字符或数字 中间有空格肯定查询不到	|  模糊查询 用户账号						|
|  2	| pwd	|Number | 搜索	| &roel=number		| 1,3,5,10,20,25,30,50,70,90,95,99 			|  根据用户权限查询						|
|  3	|stream	|Object	| 搜索	| &stream="string"	| 必须是stream的_id值 						| 根据用户所属合作公司查询 第二种情况不需要	|
|  4	|sortKey|String	| 排序	| &sortKey="string"	| code nome role steam						| 默认排序为 {shelf:-1, updAt: -1}  		|
|  5	|sortVal|Number	| 排序	| &sortVal=number	|    1, -1									|										|

##响应数据
###成功时返回数据
{
	status: 200,
	message: '创建成功',
}

###失败时返回数据
{status: 500, message: '系统登录错误, 请联系管理员。 错误码: loginFunc[1]'}