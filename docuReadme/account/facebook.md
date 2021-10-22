#facebook 第三方登陆

## api网址 https://developers.facebook.com/docs/facebook-login/web

## 坑
1 FB 强烈要求使用 HTTPS， 所以前端 用 https://
2 因为前端用 https, 所以 后端接口最好用 https:
3 开发阶段 如果 后端https 签名无效 前端接口报错 
net::ERR_CERT_AUTHORITY_INVALID
POST https://192.168.43.20:4000/api/v1/login net::ERR_CERT_AUTHORITY_INVALID
则要点https://192.168.43.20:4000/api/v1/login 进入浏览器 控制台的 NetWork
继续双击 错误 返回数据 login 会跳转到 https://192.168.43.20:4000/api/v1/login
点击 高级 继续前往 回来刷新 就可以
4 如果前端出现 网址被禁
跳转失败，原因是跳转 URI 未加入 OAuth 客户端授权设置白名单。请确保客户端和网页的 OAuth 授权登录功能已开启，并把所有应用域添加为有效 OAuth 跳转 URI。
	要前往 facebook API 开发对应的应用那 FACEBOOKE设置 设置
	在有效 OAuth 跳转 URI那 添加所使用的前端 网址就可以 比如 https://192.168.43.92:3000/