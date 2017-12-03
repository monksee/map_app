/*
 * This factory consists of the userService object which contains methods for processing data associated with a user.
 */
mapApp.factory('userFactory', function($http, $q, sharedFactory, facebookFactory, appFactory){
    "use strict";
    var userService = {};

    /*
     * Initialize a userDetails object. This object will have the following properties:
     * userID, facebookUserID, facebookName, profilePicURL, userPrivilegeID, userToken, isLoggedIn.
     */
    userService.userDetails = {   
        "userID" : null,
        "facebookUserID" : "",
        "facebookName" : "",
        "profilePicURL" : "",
        "userPrivilegeID" : 1,
        "userToken" : "",
        "isLoggedIn" : false
    };

    userService.setUserDetails = function(responseData){
        /*
         * This method takes in the response data of a http request to our auth endpoints of our API 
         * and stores the new values in the userDetails object.
         */
        this.userDetails = {
            "userID" : responseData.userID,
            "facebookUserID" : responseData.facebookUserID,
            "facebookName" : responseData.facebookName,
            "profilePicURL" : responseData.profilePicURL,
            "userPrivilegeID" : responseData.userPrivilegeID,
            "userToken" : responseData.userToken,
            "isLoggedIn" : true
        };
    };

    userService.resetUserDetails = function(){
        /*
         * This method resets the userDetails object to default values.
         */
        this.userDetails = {
            "userID" : null,
            "facebookUserID" : "",
            "facebookName" : "",
            "profilePicURL" : "",
            "userPrivilegeID" : 1,
            "userToken" : "",
            "isLoggedIn" : false
        };
    };

    userService.checkIfUserIsLoggedIn = function(){
        /*
         * This method returns the isLoggedIn boolean value of the userDetails object.
         */
        return  this.userDetails.isLoggedIn;
       
    }; 

    userService.checkIfUserIsAdmin = function(){
        /*
         * This method checks if the user is an admin or not.
         * A userPrivilegeID of 1 is a regular user and 2 is an admin user.
         */
        var userPrivilegeID = this.userDetails.userPrivilegeID;
        if(userPrivilegeID === 2){
           // console.log("userPrivilegeID " + userPrivilegeID);
            return true;
        }else{
          //  console.log("userPrivilegeID " + userPrivilegeID);
            return false;
        }
    };

    userService.checkLoginDetails = function(data){
        /*
         * This method makes a POSt request to the facebookAuth endpoint to process a user's facebook login details
         * If the facebook details are validated on the server side we get return the profile data for that user
         * We then populate the userService.userDetails object with this data 
         * If an error occurs in the process we return null (instead of the userDetails)
         */
        var self = this; 

        return $http({
                method: 'POST',
               // url: 'http://localhost/API/facebookAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/facebookAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseUserDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null
                        if(response.data.hasOwnProperty('userID') && response.data.userID !== null){
                           //Check if the userID property exists and also is not null in the response.
                            //This is the best way to determine whether the user details were successfully generated. 
                            responseUserDataIsValid = true;
                        }
                }


                //After the checks to see if the response is valid then store our user data in the userDetails object of the userFactory.
                if(responseUserDataIsValid){        
                    console.log("response.data" + JSON.stringify(response.data));       
                    self.setUserDetails(response.data);
                    //store the userToken in local storage.
                    self.setUserToken(self.userDetails.userToken);
                    return self.userDetails;
            
                }else{
                    //The data is not valid (or there has been an error)
                    //sharedFactory.buildErrorNotification(response);
                    //The controller is expecting the userDetails returned. We pass in null instead.
                    return null;
                }

            },function errorCallback(response){
              //  sharedFactory.buildErrorNotification(response);
                //The controller is expecting the userDetails returned. We pass in null instead.
                return null;
            });
    };

    userService.login = function(){
        /*
         * This method calls the facebookFactory.processFacebookLogin() in order to implement the facebook login process and 
         * return the users facebook public profile details.
         * It then calls the userService.checkLoginDetails method in order to send the details to the server side and process them there.
         * We call this method in our mainController.
         */

        var self = this;   
        var deferred = $q.defer();
        facebookFactory.processFacebookLogin().then(function(data) {
          //  alert("self userDetails " + JSON.stringify(self.userDetails));
            if(data !== null){
              
                //If the data returned from the processFacebookLogin function is not null then continue processing the data.
                self.checkLoginDetails(data).then(function(userDetails) {
                    //resolve the userDetails 
                    deferred.resolve(userDetails);
               
                });
            }
        });
        return deferred.promise;
    };


    userService.checkUserToken = function(data){
        /*
         * This function makes a POSt request to the tokenAuth endpoint to check if a userToken is valid.
         * We call this function if a userToken is detected in local storage when the app is opened.
         * Since it will be called without a user action taking place, we won't output any errors if they occur
         * If the userToken is validated on server side we get the profile data for the userID stored in that userToken if it exists
         * We then populate the userService userDetails object.
         * If it is not valid, then we just delete it from local storage.
         */
        var self = this; 
        return $http({
                method: 'POST',
               // url: 'http://localhost/API/tokenAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/tokenAuth?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                   'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                console.log(response.data);
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseUserDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null
                        if(response.data.hasOwnProperty('userID') && response.data.userID !== null){
                            //Check if the userID property exists and also is not null in the response.
                            //This is the best way to determine whether the user details were successfully generated. 
                            responseUserDataIsValid = true;
                        }
                }
                //After the checks to see if the response is valid then store our user data in the userDetails object of the userFactory.
                if(responseUserDataIsValid){
                    self.setUserDetails(response.data);
                    //store the userToken in local storage.
                    self.setUserToken(self.userDetails.userToken);
                    return self.userDetails;
                }else{
                    //Since this function is called without any user action taking place we wont output any errors if they occur.
                    //We just clear the token from local storage
                    self.resetUserDetails();
                    self.removeUserToken(); 
                    return null;
                }
            },function errorCallback(response){
                //Error during checking userToken when the app loaded therefore delete the userToken from local storage and 
                //reset the userDetails object.
                //Do not notify the user of any error.
                self.resetUserDetails();   
                self.removeUserToken();     
                return null;     
            });   
    };

    userService.getUserToken = function(){
        //get the userToken value in localStorage
        return localStorage.getItem('userToken');
    };

    userService.setUserToken = function(userToken){
        //setting the userToken value in localStorage like this will overwrite any value thats currently there (if the "userToken" key exists)
        localStorage.setItem('userToken', userToken);
    };


    userService.removeUserToken = function(){
        //remove the userToken from localStorage
        localStorage.clear();
    };
  	//return public API so that we can access it in all controllers
  	return{
        userService: userService
 	};
});