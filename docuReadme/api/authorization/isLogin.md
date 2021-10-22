/isLogin
是否登录
判断用户登录状态, 并返回用户的角色、权限等值(前端可以根据返回用户信息做页面)
接口请求 方式 GET
接口参数
本接口除了传递headers 不需要任何参数， 只是判断用户现在的状态是否是登录状态
accessToken 是本地存放的token值
headers: {
	authorization: "accessToken",
}

##响应数据
###返回 status == 200 为登录状态
{status: 200, message: '登陆状态', data: {user}}
可根据返回的user进行权限判断

###返回 status ！= 200 为非登录状态
{status: 400, message: "权限参数错误"}