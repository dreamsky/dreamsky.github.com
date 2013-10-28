/*
	common.js
*/

define(['jquery'], function ($) {
	$.fn.extend({
		bg: function(color) {
			$(this).css('background-color', color);
		}
	});
})