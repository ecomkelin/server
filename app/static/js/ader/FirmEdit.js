$(function() {
	const Stint_Firm = JSON.parse($("#Stint_Firm").val());

	$("#adFirmPost-Form").submit(function(e) {
		const code = $("#codeIpt").val();
		const nome = $("#nomeIpt").val();

		if(!codeFilter(code)){
			e.preventDefault();
		} else if(!nomeFilter(nome)) {
			e.preventDefault();
		}
	})

	$("#adFirmUpd-Form").submit(function(e) {
		const code = $("#codeIpt").val();
		const nome = $("#nomeIpt").val();

		if(!codeFilter(code)){
			e.preventDefault();
		} else if(!nomeFilter(nome)) {
			e.preventDefault();
		}
	})


	$("#codeIpt").blur(function() {
		const code = $(this).val().replace(/^\s*/g,"").toUpperCase();
		$(this).val(code);
		codeFilter(code)
	})
	$("#nomeIpt").blur(function() {
		const nome = $(this).val().replace(/^\s*/g,"").toUpperCase();
		$(this).val(nome);
		if(nomeFilter(nome)) $("#nickIpt").val(nome);
	})


	const codeFilter = (code) => {
		const regexp = new RegExp(Stint_Firm.code.regexp);
		if(!code || code.length < Stint_Firm.code.min || code.length > Stint_Firm.code.max){
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
	const nomeFilter = (nome) => {
		if(!nome || nome.length < Stint_Firm.nome.min || nome.length > Stint_Firm.nome.max){
			$("#nomeLabel").removeClass("text-info");
			$("#nomeLabel").addClass("text-danger");
			$("#nomeOpt").show();
			return false;
		} else {
			$("#nomeLabel").removeClass("text-danger");
			$("#nomeLabel").addClass("text-info");
			$("#nomeOpt").hide();
			return true;
		}
	}
})