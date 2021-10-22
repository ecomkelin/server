$(function() {
	const Stint_User = JSON.parse($("#Stint_User").val());

	$("#adUserPost-Form").submit(function(e) {
		const code = $("#codeIpt").val();
		const pwd = $("#pwdIpt").val();
		const role = $("#roleIpt").val();
		const Firm = $("#FirmIpt").val();
		if(!phonePreFilter(phonePre)){
			e.preventDefault();
		} else if(!phoneFilter(phone)) {
			e.preventDefault();
		} else if(!codeFilter(code)) {
			e.preventDefault();
		} else if(!pwdFilter(pwd)) {
			e.preventDefault();
		} else if(!roleFilter(role)) {
			e.preventDefault();
		} else if(!FirmFilter(Firm)) {
			e.preventDefault();
		}
	})

	$("#adUserUpdCode-Form").submit(function(e) {
		const code = $("#codeIpt").val();
		if(!codeFilter(code)){
			e.preventDefault();
		}
	})
	$("#adUserUpdPwd-Form").submit(function(e) {
		const pwd = $("#pwdIpt").val();
		const pwdCheck = $("#pwdCheckIpt").val();
		if(!pwdFilter(pwd)) {
			e.preventDefault();
		} else if(!pwdCheckFilter(pwdCheck, pwd)) {
			e.preventDefault();
		}
	})

	$("#phonePreIpt").blur(function() {
		const phonePre = $(this).val().replace(/^\s*/g,"").toUpperCase();
		$(this).val(phonePre);
		phonePreFilter(phonePre)
	})
	$("#phoneIpt").blur(function() {
		const phone = $(this).val().replace(/^\s*/g,"").toUpperCase();
		$(this).val(phone);
		phoneFilter(phone)
	})
	$("#codeIpt").blur(function() {
		const code = $(this).val().replace(/^\s*/g,"").toUpperCase();
		$(this).val(code);
		codeFilter(code)
	})
	$("#pwdIpt").blur(function() {
		const pwd = $(this).val().replace(/^\s*/g,"");
		$(this).val(pwd);
		pwdFilter(pwd)
	})
	$("#pwdCheckIpt").blur(function() {
		const pwdCheck = $(this).val().replace(/^\s*/g,"");
		$(this).val(pwdCheck);
		const pwd = $("#pwdIpt").val().replace(/^\s*/g,"");
		pwdCheckFilter(pwdCheck, pwd)
	})
	$("#roleIpt").change(function() {
		const role = $("#roleIpt").val();
		roleFilter(role)
	})
	$("#FirmIpt").change((e) => {
		const Firm = $("#FirmIpt").val();
		FirmFilter(Firm)
	})

	const phonePreFilter = (phonePre) => {
		const regexp = new RegExp(Stint_User.phonePre.regexp);
		if(!phonePre || phonePre.length != Stint_User.phonePre.trim || !regexp.test(phonePre)){
			$("#phonePreLabel").removeClass("text-info");
			$("#phonePreLabel").addClass("text-danger");
			$("#phonePreOpt").show();
			return false;
		} else {
			$("#phonePreLabel").removeClass("text-danger");
			$("#phonePreLabel").addClass("text-info");
			$("#phonePreOpt").hide();
			return true;
		}
	}
	const phoneFilter = (phone) => {
		const regexp = new RegExp(Stint_User.phone.regexp);
		if(!phone || phone.length != Stint_User.phone.trim || !regexp.test(phone)){
			$("#phoneLabel").removeClass("text-info");
			$("#phoneLabel").addClass("text-danger");
			$("#phoneOpt").show();
			return false;
		} else {
			$("#phoneLabel").removeClass("text-danger");
			$("#phoneLabel").addClass("text-info");
			$("#phoneOpt").hide();
			return true;
		}
	}
	const codeFilter = (code) => {
		const regexp = new RegExp(Stint_User.code.regexp);
		if(!code || code.length < Stint_User.code.min || code.length > Stint_User.code.max || !regexp.test(code)){
			$("#codeLabel").removeClass("text-info");
			$("#codeLabel").addClass("text-danger");
			$("#codeOpt").show();
			return false;
		} else {
			$("#codeLabel").removeClass("text-danger");
			$("#codeLabel").addClass("text-info");
			$("#codeOpt").hide();
			return true;
		}
	}
	const pwdFilter = (pwd) => {
		if(!pwd || pwd.length < Stint_User.pwd.min || pwd.length > Stint_User.pwd.max){
			$("#pwdLabel").removeClass("text-info");
			$("#pwdLabel").addClass("text-danger");
			$("#pwdOpt").show();
			return false;
		} else {
			$("#pwdLabel").removeClass("text-danger");
			$("#pwdLabel").addClass("text-info");
			$("#pwdOpt").hide();
			return true;
		}
	}
	const pwdCheckFilter = (pwdCheck, pwd) => {
		if(pwdCheck !== pwd){
			$("#pwdCheckLabel").removeClass("text-info");
			$("#pwdCheckLabel").addClass("text-danger");
			$("#pwdCheckOpt").show();
			return false;
		} else {
			$("#pwdCheckLabel").removeClass("text-danger");
			$("#pwdCheckLabel").addClass("text-info");
			$("#pwdCheckOpt").hide();
			return true;
		}
	}
	const roleFilter = (role) => {
		if(role == 0){
			$("#roleLabel").removeClass("text-info");
			$("#roleLabel").addClass("text-danger");
			$("#roleOpt").show();
			return false;
		} else {
			$("#roleLabel").removeClass("text-danger");
			$("#roleLabel").addClass("text-info");
			$("#roleOpt").hide();
			return true;
		}
	}
	const FirmFilter = (Firm) => {
		if(Firm == 0){
			$("#FirmLabel").removeClass("text-info");
			$("#FirmLabel").addClass("text-danger");
			$("#FirmOpt").show();
			return false;
		} else {
			$("#FirmLabel").removeClass("text-danger");
			$("#FirmLabel").addClass("text-info");
			$("#FirmOpt").hide();
			return true;
		}
	}
})