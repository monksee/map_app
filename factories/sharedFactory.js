/*
 * This factory consists of general methods which we will use throughout different controllers and factories
 */
mapApp.factory('sharedFactory', function(){

    var buildErrorNotification = function(response){
        /*
         * This method takes in a response from an endpoint of our API.
         * It checks if the json data contains a property called "error"
         * The "error" property contains a message that is specific to whatever error occured on the server side so we want to give
         * that clue to the user.
         */
        var userIsOnline = navigator.onLine;
        if(!userIsOnline){
            alert("No internet connection! \n\nPlease take the following steps: \n\n 1. Make sure mobile data or Wi-Fi is turned on. \n\n 2. Make sure aeroplane mode is off. \n\n 3. Check the signal in your area.");
        }else if(response.hasOwnProperty('data') && response.data !== null && response.data.hasOwnProperty('error')){
            //The response data has the error property
            //I'm not sure about outputting these errors to the user. They may give away sensitive info.
            //e.g. SQLSTATE[HY000] [1045] Access denied for user 'sarahmon_monksee'@'localhost'
            console.log(response.data.error);
            alert("We\'re sorry but an unexpected error has occured: " + response.data.error);
        }else{
            //Output a more generalized error message.
            alert("We\'re sorry but an unexpected error has occured. Please contact support!");
        }
    };


    var checkIfEmptyObject = function(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key))
            return false;
        }
        return true;
    };

  	//return public API so that we can access it in all controllers
  	return{
        buildErrorNotification: buildErrorNotification,
        checkIfEmptyObject: checkIfEmptyObject
       
 	};
});