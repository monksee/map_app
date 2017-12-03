/*
 * This factory consists of 
 */
mapApp.factory('appFactory', function(){
    "use strict";
    var appService = {


    };
    appService.appDetails = {
            "appRootURL" : "http://localhost"//'http://gamuzic.com'//"http://localhost" // 
    };

  	//return public API so that we can access it in all controllers
  	return{
        appService: appService
 	};
});