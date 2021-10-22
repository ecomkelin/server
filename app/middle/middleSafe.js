let fq_st1_ids = [];
exports.fq_spanTimes1_Func = (uniqueIndex) => {
	spanTimes(fq_st1_ids, uniqueIndex, 5000, 30)
}


const spanTimes = (sts, uniqueIndex, max_timespan, max_times) => {
	let visiter = null;
	for(let i=0; i<sts.length; i++) {
		let timeSpan = Date.now() - sts[i].at_last;
		if(timeSpan > max_timespan){
			sts.splice(i, (sts.length - i));
			break;
		}
		if(String(uniqueIndex) === String(sts[i].uniqueIndex)) {
			visiter = sts[i];
			break;
		}
	}
	if(!visiter) {
		sts.unshift({
			at_last: Date.now(),
			uniqueIndex: uniqueIndex,
			times: 1
		})
	} else {
		if(visiter.times > max_times) {
			return true;
		} else {
			visiter.times++;
		}
	}
	return false;
}