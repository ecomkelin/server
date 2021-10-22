const jwt = require('jsonwebtoken');

/* ============================== 获取token ============================== */
exports.obtain_token_from_headersToken = (headersToken) => {
	if(!headersToken) return null;
	const hts = String(headersToken).split(" ");
	if(hts && hts.length > 1) return hts[1];
	return null;
}

/* ================================ 验证 ================================ */
exports.accessToken_VerifyProm = (token)=> {
	return new Promise((resolve) => {
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (expired, payload) => {
			if(expired) return resolve({status: 401, message: "[server] 授权过期 accessToken expired", expired});
			return resolve({status: 200, payload});
		})
	})
}
exports.refreshToken_VerifyProm = (token)=> {
	return new Promise((resolve) => {
		jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (expired, payload) => {
			if(expired) return resolve({status: 401, message: "[server] 授权过期 refreshToken expired", expired});
			return resolve({status: 200, payload});
		})
	})
}

/* ================================ 签名 ================================ */
exports.generateAccessToken = (obj)=> {
	const payload = generatePayload(obj);
	return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EX})
}
exports.generateRefreshToken = (obj)=> {
	const payload = generatePayload(obj);
	return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EX})
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