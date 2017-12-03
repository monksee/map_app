/*
 * This factory consists of functions for working with the facebook API using the phonegap facebookConnectPlugin (cordova-plugin-facebook4) 
 * We take in the phonegapReady factory as a parameter which detects when phonegaps deviceready event occurs.
 * This is because we cannot use the facebookConnectPlugin before the deviceready event occurs
 * We use this factory in our userFactory.
 */
mapApp.factory('facebookFactory', function($q, phonegapReady, validatorFactory){

    //Define our private variables
    var getLoginStatus = function(){
    	/* 
    	 * This function uses the facebookConnectPlugin.getLoginStatus function which gets a user's current facebook login status.
    	 * It returns a response.status of "connected" if the user is logged into our app and facebook.
    	 */
        var deferred = $q.defer();
    	facebookConnectPlugin.getLoginStatus(
    		function(response){
        	    //Success. Return the status of the response
                deferred.resolve(response.status); 
		    }, 
	        function(error){ 
	    	    //Handle the error, outputing a message to the user if necessary
			    handleFacebookError(error);
                deferred.resolve(null);      
		    }
		);
		return deferred.promise;
    };


    var performFacebookLogin = function(){
    	/* 
    	 * This function uses the facebookConnectPlugin.login function.
    	 * When we call the facebookConnectPlugin.login function, it firstly detects if a user is logged into facebook.
    	 * If they are logged in, it returns a response.status of "connected".
    	 * If they are not currently logged into facebook, a facebook login dialog will pop up for them to log in.
    	 * If they enter the correct login details in the facebook dialog, it returns a response.status of "connected".
    	 */
    	var deferred = $q.defer();
     	facebookConnectPlugin.login(["public_profile"], 
     		function(response){
  			    //Success. Return the status of the response
			    deferred.resolve(response.status); 			   
		    },
		    function(error){   
		        //Handle the error, outputing a message to the user if necessary
		        handleFacebookError(error);
                deferred.resolve(null); 
    	    }
    	);
		return deferred.promise;
    };


    var getProfileDetails = function(){
        /* 
    	 * This function makes a call to the facebook API (using the facebookConnectPlugin.api function) 
    	 * and gets a user's facebook public profile data.
    	 * The user must be logged in first before we can call this function
    	 */
        var deferred = $q.defer();
        /* 
         * Note: On iOS it causes an error if there are spaces between the properties in the api call below
         * (e.g /me?fields=id, name, link, picture, ...issue 338 for cordova-plugin-facebook4 on github)
         * So we need to write it as follows: /me?fields=id,name,link,picture
         */
        facebookConnectPlugin.api('/me?fields=id,name,link,picture',["public_profile"],
        	function(data){
        		//Success. Validate and prepare the data before returning it
  			    var preparedData = validateFacebookDetails(data);
                deferred.resolve(preparedData); 
		    },
		    function(error){
			    //Handle the error, outputing a message to the user if necessary
        	    handleFacebookError(error);
        	    deferred.resolve(null); 
    	    }
    	); 
        return deferred.promise;
    };



    var handleFacebookError = function(error){
    	/* 
    	 * The facebook API returns an error as an object on android and as a string on iOS.
    	 * So this function firstly checks what "type" the error is (object or string) and then handles it
    	 * Also looking out for the "User cancelled dialog" error (errorCode: 4201 on android),
    	 * as we do not want to output a message to the user when this error occurs.
    	 */
        var userIsOnline = navigator.onLine;

        if(!userIsOnline){
            alert("No internet connection! \n\nPlease take the following steps: \n\n 1. Make sure mobile data or Wi-Fi is turned on. \n\n 2. Make sure aeroplane mode is off. \n\n 3. Check the signal in your area.");
     
        }else if(error !== null && typeof error === 'object'){
        	//Error is an object so therefore we are on android 
            if(!(error.hasOwnProperty('errorCode') && error.errorCode === "4201")){
                //This is not a "User cancelled dialog" (4201) error so we will output the error to the user   
                alert("We're sorry but the following error occured when trying to process your request: " + error.errorMessage); 
            }
        }else if(typeof error === 'string'){
        	//Error is not an object therefore we are on iOS and the error is a string.
        	//Check if the error string equals "User cancelled" because this is what iOS returns when user cancels out of logging in to facebook. 
        	if(error.indexOf("User cancelled") == -1){
        		//The error string does not contain "User cancelled" so we will output an error message.
                alert("We're sorry but the following error occured when trying to process your request: " + error);
        	}
        }else{

            alert("We're sorry but an unexpected error occured when trying to process your request.");
        }
    };


    var validateFacebookDetails = function(userDetails){
        /* 
    	 * This function checks if the facebook user details are valid
    	 * If they are valid then we prepare them (for sending to the server later, in our http request in the userFactory)
    	 * and return an object called data.
    	 * If they are not valid we return null.
    	 */
        var facebookUserID = userDetails.id;
        var facebookName = userDetails.name;
        //The "picture" returned from the facebook api call is the tiny thumbnail so instead of using that we get a larger size picture
        //by using the user's id in the following way:
        var profilePicURL = "https://graph.facebook.com/" + userDetails.id + "/picture?type=large&w‌​idth=200&height=200";  


	    var inputsAreValid = validatorFactory.validateFacebookInputs(
	    	[{"input" : facebookUserID, "minLength" : 1, "maxLength" : 30, "regex" : /^\d+$/},
            {"input" : facebookName, "minLength" : 1, "maxLength" : 60},
            {"input" : profilePicURL, "minLength" : 1, "maxLength" : 250}]);
        if(inputsAreValid){
            //After inputs are checked for validity then we prepare the data
            var data = {
                "facebookUserID" : facebookUserID, 
                "facebookName" : facebookName, 
                "profilePicURL" : profilePicURL
            };
            return data;
        }else{
        	//If the inputs are not valid then return null
            return null;
        }
    };



    var processFacebookLogin = phonegapReady(function(){
    	/* 
    	 * This function checks a user's facebook login status, logs them into facebook if necessary, retrieves and returns their public profile data.
    	 * If an error occurs along the way, we return null so that we can check for this when this function is called.
    	 * We wrap this function in the phonegapReady function so that it doesn't get called before the phonegap deviceready event occurs.
    	 */
    	var deferred = $q.defer();

        getLoginStatus().then(function(responseStatus){   
            //Check the current login status of the user
            if(responseStatus === "connected"){
                //the user is logged into facebook and our app
            	
            	getProfileDetails().then(function(preparedData){ 
            		//preparedData will be null if there was an error when getProfileDetails() was called
            		//or if the user data (returned from the api call) was invalid after calling validateFacebookDetails
                    deferred.resolve(preparedData); 
    	        });
    	    }else if(responseStatus !== null){
    	    	//If the user is not "connected" then log the user into facebook and our app
              	performFacebookLogin().then(function(responseStatus){
                    if(responseStatus === "connected"){
                    	//the user is now logged into facebook and our app
                        getProfileDetails().then(function(preparedData){
            		        //preparedData will be null if there was an error when getProfileDetails() was called
            		        //or if the user data (returned from the api call) was invalid after calling validateFacebookDetails
                            deferred.resolve(preparedData); 
    	                });
                    
                    }else{
                    	//responseStatus is not "connected" so we cannot retrieve the profile data. Therefore return null.
                    	//We will check for null when this function is called in the controller and stop the rest of the processing there.
                    	deferred.resolve(null);                   
                    }
                });
            }else{
            	//responseStatus is null so an error occured. Therefore return null.
            	//We will check for null when this function is called in the controller and stop the rest of the processing there.
            	deferred.resolve(null);   
            }
        });

        return deferred.promise;
    });
    var logOutOfFacebook = phonegapReady(function(){
        facebookConnectPlugin.logout(
            function(data){
                //Returns "OK" if successful on android but null on iOS.
            },
            function(error){

            }

        );
    });
    //return public API so that we can access it in all controllers
  	return{
        processFacebookLogin: processFacebookLogin,
        logOutOfFacebook: logOutOfFacebook
 	};
});