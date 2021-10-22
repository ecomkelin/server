$(() => {
	$("#toggle_del_Btn").click(function(e) {
		$(".del_show").toggle();
	})
	$("#change_detail_update_Btn").click(function(e) {
		$(".page_detail").toggle();
		$(".page_update").toggle();
	})
})