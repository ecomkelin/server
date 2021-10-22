module.exports = {
	role_Arrs: [1, 3, 5, 101, 105],
	// role_Arrs: [1, 3, 4, 10, 20, 30, 40, 50, 101, 105],
	role: {
		"1": 	{val: 'ower', en: 'owner', cn: "拥有者"},
        "3": 	{val: 'mger', en: 'manager', cn: "管理者"},
        "5": 	{val: 'sfer', en: 'staff', cn: "超级员工"},
        "101": 	{val: 'bser', en: 'boss', cn: "店铺老板"},
        "105": 	{val: 'wker', en: 'worker', cn: "店铺员工"},
	},
	role_set: {
		owner:		1,
		manager:	3,
		staff:		5,
		boss:		101,
		worker:		105,
	},


	Lang: {
		cn: {num: 1, val: '中文'},
		en: {num: 2, val: 'English'},
		it: {num: 3, val: 'Italiano'},
	},
}