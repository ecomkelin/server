/bnCategFirs
获取用品牌一级分类列表

接口请求 方式 GET
权限要求: 无

接口参数
有翻页功能

| 序号	| 变量		|  类型	| 功能	|       规范				|             限制					|                 描述					|
| -----	| -----		| -----	| ----	| -----------------		| ---------------------------------	| -------------------------------------	|
|  1	| code		|String	| 搜索	| &code="string"		| 不区分大小写 一般是2-3个英文字符		|  模糊查询 用户一级分类编号				|
|  2	| nome		|String | 搜索	| &nome="string"		| 区分大小写				 			|  模糊查询 用户一级分类名称				|
|  3	|nomeEN		|String	| 搜索	| &nomeEN="string"		| 区分大小写 						|  模糊查询 用户一级分类英文名称			|
|  4	|nomeCN		|String	| 搜索	| &nomeCN="string"		| 			 						|  模糊查询 用户一级分类中文名称			|
|  101	|sortKey	|String	| 排序	| &sortKey="string"		| code nome nomeEN nomeCN			| 默认排序为 {shelf:-1, updAt: -1}  		|
|  102	|sortVal	|Number	| 排序	| &sortVal=number		|    1, -1							|										|

##响应数据
###成功时返回数据
{
	status: 200,
	message: '登录成功',
	data: {nations, count, page, pagesize},
}
count: 传递参数后, 能够获取的数目
page: 返回的页面,传递过去即返回过来
pagesize: 每页的条目数

###失败时返回数据
{status: 500, message: '系统登录错误, 请联系管理员。 错误码: loginFunc[1]'}