// require('dotenv').config()
require('dotenv').config({path: './env/.env'})

const express = require('express');
const app = express();

// 链接数据库
const dbName = process.env.DBNAME;
const dbUrl = process.env.DBSERVER + dbName;
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl, {
	useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true
});

const session = require('express-session');
const mongoStore = require('connect-mongo')(session);
app.use(session({
	secret: dbName,
	resave: false,
	saveUninitialized: true,
	store: new mongoStore({
		url: dbUrl,
		collection: 'sessions'
	})
}));

// cookie
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded( { extended: true } ) );
app.use(express.json());
app.use(bodyParser.json());

// 设置系统html编辑模板
app.set('views', './app/views');
app.set('view engine', 'pug');

// 前端读取配置数据
app.locals.moment = require('moment');// 时间格式化
app.locals.Conf = require('./app/config/Conf.js');// 
app.locals.Stint = require('./app/config/Stint.js');// 

// 设置静态资源
const path = require('path');
const serveStatic = require('serve-static');
app.use(serveStatic(path.join(__dirname, "public")));
app.use(serveStatic(path.join(__dirname, "./app/static")));

// 跨域
const cors = require('cors');
// app.use(cors({credentials: true, origin: 'http://localhost:8080'}));
// const whitelist = ['http://localhost:8080', 'http://localhost:8050']
// const corsOptions = {
// 	credentials: true,
// 	origin: function (origin, callback) {
// 		if (whitelist.indexOf(origin) !== -1) {
// 			callback(null, true)
// 		} else {
// 			callback(new Error('Not allowed by CORS'))
// 		}
// 	}
// }
// app.use(cors(corsOptions));
app.use(cors());

// 前端代码压缩
// app.use(require('compression')());

// 调用路由
require('./app/route/_Router')(app);

// 如果没有路由，则跳转到404页面	
app.use(function(req, res, next) {
	res.render("404");
});

// // 服务器监听
// const fs = require('fs');
// const https = require('https');
// const privkey = fs.readFileSync('../https/private.pem', 'utf8');
// const certifig = fs.readFileSync('../https/file.crt', 'utf8');
// const objcred = {key: privkey, cert: certifig};
// const serverHttps = require('https').createServer(objcred, app);
// serverHttps.listen(process.env.HTTPS, function(){
// 	console.log('Server start on port: https://localhost:' + process.env.HTTPS);
// });

const serverHttp = require('http').createServer(app);
serverHttp.listen(process.env.HTTP, function(){
	console.log('Server start on port: http://localhost:' + process.env.HTTP);
});