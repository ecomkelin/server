/logout
用户登出

接口请求 方式 DELETE
接口参数
本接口 可以不传递headers
| 序号 |    变量名     |  类型  | 必要 |        规范      |          描述          |
| ---- | ------------ | ------ | ----| ---------------- | ---------------------- |
|  1   | refreshtoken | String |  Y  |                  | 删除服务器中的 refreshToken 使token无效 |

##响应数据
###成功时返回数据
{status: 200, message: '成功从服务器登出'}

###失败时返回数据
{status: 400, message: '服务器未删除'}
{status: 400, message: '未登出'}