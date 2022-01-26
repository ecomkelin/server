const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

/*
	img_Dir: 	保存在 public/upload/ 下的哪个文件夹
	field: 		图片 属于数据库中的哪个 field (比如 "img_url" "img_urls" "img" "imgUrl");
	is_Array: 	上传的图片是单张还是多张
*/
exports.mkPicture_prom = async(req, {img_Dir, field, is_Array}) => {
	return new Promise((resolve, reject) => {
		try {
			const payload = req.payload;
			const img_abs = path.join(__dirname, '../../public/upload'+img_Dir);
			const form = formidable({ multiples: true, uploadDir: img_abs});
			form.parse(req, (err, fields, files) => {
				if (err) return reject(err);
				// 接受 body信息 obj 的具体信息是 fields中的obj存储的信息
				const obj = (fields.obj) ? JSON.parse(fields.obj) : {};
				if(is_Array) obj[field] = [];
				if(!files) return resolve(obj);	// 如果没有传递正确的 file文件 则直接返回
				let lenFile = 0;
				let keys = [];
				for(key in files) {
					keys.push(key);
					lenFile++;
				}
				const warnMsg = {};
				warnMsg.files = [];
				multiplesPic_Func(resolve, obj, field, img_Dir, warnMsg, files, keys, payload._id, lenFile, 0);
			})
		} catch(error) {
			console.log("mkPicture_prom", error)
			return reject(error);
		}
	})
}

const multiplesPic_Func = (resolve, obj, field, img_Dir, warnMsg, files, keys, payload_id, lenFile, n) => {
	if(n == lenFile) return resolve(obj);
	const key = keys[n];
	if(files[key] && files[key].path) {
		// const isLt=file.size/1024/1024/<4;	// 判断图片大小 如果图片过大 可以压缩
		const file = files[key]
		const oldfliepath = file.path;
		// 接收 图片的路由信息 以便分类存储图片， 如果路由信息不存在, 则放入默认文件夹
		const pubSrc = path.join(__dirname, '../../public');	// niu/public/upload/***/
		let imgType = file.type.split('/')[1];
		const imgArrs = ["jpg", "jpeg", "png", "gif"];
		if(!imgArrs.includes(imgType)) {
			this.rmPicture()
			warnMsg.fileType = "只允许输入jpg png gif格式图片";
			console.log(warnMsg.fileType);
			multiplesPic_Func(resolve, obj, field, img_Dir, warnMsg, files, keys, payload_id, lenFile, n+1);
		} else {
			const img_url = "/upload"+img_Dir+"/" + payload_id + '-'+n+'-' + Date.now() + '.' + imgType;
			const newfilepath = pubSrc + img_url;
			// console.log('oldfliepath', oldfliepath)
			// console.log('newfilepath', newfilepath)
			fs.rename(oldfliepath, newfilepath, err => {
				if(err) {
					console.log("multiplesPic_Func", err)
					warnMsg.files.push("您传输的第"+n+"张图片错误");
					multiplesPic_Func(resolve, obj, field, img_Dir, warnMsg, files, keys, payload_id, lenFile, n+1);
				} else {
					if(obj[field]) {
						obj[field].push(img_url);
					} else {
						obj[field] = img_url;
					}
					multiplesPic_Func(resolve, obj, field, img_Dir, warnMsg, files, keys, payload_id, lenFile, n+1);
				}
			})
		}
	} else {
		multiplesPic_Func(resolve, obj, field, img_Dir, warnMsg, files, keys, payload_id, lenFile, n+1);
	}
}



exports.rmPicture = (oldfliepath) => {
	if(oldfliepath) {
		fs.unlink(path.join(__dirname, '../../public' + oldfliepath), (err) => {
			if(err) {
				console.log("rmPicture", err);
			}
		});
	}
}