const jwt = require('jsonwebtoken');

/* ============================== 获取token ============================== */
exports.obtain_headersInfo = (headersToken) => {
	if(!headersToken) return {codePlat: null, token: null, is_refresh: null};
	const hts = String(headersToken).split(" ");
	if(hts.length === 1) return {codePlat: hts[0], token: null, is_refresh: null};
	else if(hts.length === 2) return {codePlat: hts[0], token: hts[1], is_refresh: null};
	else {
		if(hts[2] == 're') return {codePlat: hts[0], token: hts[1], is_refresh: hts[2]};
		return {codePlat: hts[0], token: hts[1], is_refresh: null};
	}
}

/* ================================ 验证 ================================ */
exports.token_VerifyProm = (headersToken)=> {
	return new Promise(async(resolve) => {
		try {
			const {token, is_refresh} = this.obtain_headersInfo(headersToken);
			if(!token) return  resolve({status: 400, message: "[server] 请您传递 headers 空格后第第二个token信息"});
			const token_secret = is_refresh ? process.env.REFRESH_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET;
			jwt.verify(token, token_secret, (expired, payload) => {
				if(expired) return resolve({status: 401, message: "[server] token 过期", expired});
				return resolve({status: 200, data: {token, is_refresh, payload}});
			})
		} catch(error) {
			console.log(error);
			return resolve({status: 500, message: '[server] token_VerifyProm Error'});
		}
	})
}


/* ================================ 签名 ================================ */
exports.generateToken = (obj, is_refresh=null)=> {
	const payload = generatePayload(obj);
	const token_secret = is_refresh ? process.env.REFRESH_TOKEN_SECRET : process.env.ACCESS_TOKEN_SECRET;
	const token_ex = is_refresh ? process.env.REFRESH_TOKEN_EX : process.env.ACCESS_TOKEN_EX;
	return jwt.sign(payload, token_secret, {expiresIn: token_ex});
}

const generatePayload = (obj)=> {
	const payload = {};
	if(obj._id) payload._id = obj._id;
	if(obj.Firm) payload.Firm = obj.Firm;
	if(obj.Shop) payload.Shop = obj.Shop;
	if(obj.role) payload.role = obj.role;
	if(obj.code) payload.code = obj.code;
	if(obj.nome) payload.nome = obj.nome;
	if(obj.phonePre) payload.phonePre = obj.phonePre;
	if(obj.phone) payload.phone = obj.phone;
	if(obj.email) payload.email = obj.email;
	return payload;
}