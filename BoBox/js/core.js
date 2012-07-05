	
	// deviceready envent listener
	$(function(){
		document.addEventListener("deviceready", onDeviceReady, false);
	});
	
/*	function onLoad(){	
		document.addEventListener("deviceready", onDeviceReady, false);
	}*/

    // Cordova is loaded and it is now safe to make calls Cordova methods
    function onDeviceReady() {
        // Register the event listener
        document.addEventListener("menubutton", onMenuKeyDown, false);
        document.addEventListener("backbutton", onBackKeyDown, false);
    }

    // Handle the menu button
    function onMenuKeyDown() {
		if($("#popup").length>0){
			return;
		}
		var fh=$("[data-role='footer']").height();
		var $popup=$("<div id='popup' style='bottom:"+fh+"px;'><a href='#' id='about'><b>About</b></a><a href='#' id='exit'><b>Exit</b></a></div>")
		$popup.appendTo($("body")).slideDown("slow");
    }
    
    // Handle the back button
    function onBackKeyDown() {
    	//TODO
    }
    
    // Bind click event to the about button
    $("#about").live("click",function(){
    	$("#popup").hide();
    	$.mobile.changePage("about.html", { transition: "pop"} );
    });
    
    // Bind click event to the exit button
    $("#exit").live("click",function(){
    	if(window.confirm("Are you sure to exit?")){
    		navigator.app.exitApp()
    	}
    });