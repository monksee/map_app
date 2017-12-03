/*
 * This factory consists of objects and methods which will process data associated with the petrol stations.
 */
mapApp.factory('stationFactory', function($http, $timeout, $q, $compile, sharedFactory, userFactory, reviewFactory, geolocationFactory, appFactory){
    "use strict";
    var stationService = {};

    /* Create an object which holds the stationDetails for the station view
    */
    stationService.stationDetails = {
            "stationID" : null,
            "stationName" : "",
            "stationAddressLine1" : "",
            "stationAddressLine2" : "",
            "stationAddressLine3" : "",
            "stationPhoneNumber" : "",
            "stationLatLng" : {"lat" : 0.0, "lng" : 0.0},
            "stationServices" : [],
            "averageRatingData" : {},
            "reviews" : []
    };
    /* Create an array which will hold all info needed to pinpoint all of our stations on a google map.
     * Each element of this array will be an object for example the following:
     * {"stationID" : 5, "stationName" : "", "stationLatLng" : {"lat" : 0.0, "lng" : 0.0}}
     */
    //var appRootURL = 'http://localhost'; // 'http://gamuzic.com';
    stationService.allStationsMapData = [];

    stationService.map;
    stationService.infoWindow;
    stationService.infoWindowContent;

    stationService.infoWindowStationID;
    stationService.infoWindowStationName;
    stationService.infoWindowStationLatLng;
    stationService.directionsDisplay;
    stationService.directionsService;
    stationService.stationMarkers = [];
    stationService.currentPositionMarkers = [];

    stationService.getAllStationsMapData = function(){
         /**
         * This method makes a http GET request to our allStationsMapData Endpoint to retrieve details needed for all 
         * stations to be pinpointed on a google map.
         * The home view will display the google map however we will call this method in the mainController.
         * This API call should only be made once the app opens (not everytime we go to the home view)
         * We return the allStationsMapData array or if an error occurs we return null.
         */
        var self = this; 
        return $http({
            method: 'GET',
           // url: 'http://localhost/API/allStationsMapData?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
           // url: 'http://gamuzic.com/API/allStationsMapData?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            url: appFactory.appService.appDetails.appRootURL + '/API/allStationsMapData?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            headers: {
               'Content-Type': 'application/json;charset=utf-8'
            },
            responseType:'json'
        }).then(function successCallback(response){
            //Do checks to see if the response data is valid. 
            var responseDataIsValid = false; //initialize boolean to false
            if(response.hasOwnProperty('data') && response.data !== null){
                //check if the data property is present in the response and it is not null
                if(!response.data.hasOwnProperty('error')){     
                    //response does not have error property therefore it is valid       
                    responseDataIsValid = true;
                }
            }
            if(responseDataIsValid){           
                self.allStationsMapData = self.prepareStationMapData(response.data);
              // console.log(JSON.stringify(self.allStationsMapData));
                return self.allStationsMapData;
            }else{
                return null;
            }
        },function errorCallback(response){

            sharedFactory.buildErrorNotification(response);
            return null;
        });
    };


    stationService.prepareStationMapData = function(allStationsMapData){
        /*
         * This method takes in the stations map data that we retrieved on the server side from our database and prepares
         * it in the way that we need it for our google map.
         * i.e it converts the lat and lng points to float numbers as they were incorrectly interpreted as strings without this.
         * We also create a stationShortAddress with the name and addressLine2 of the station so that we can display this
         * in the select menu of the directions form for the destination.
         */
        var preparedMapData = [];
        allStationsMapData.forEach(function(stationMapData) {
            preparedMapData.push({
                "stationName" : stationMapData.stationName,
                "stationShortAddress" : stationMapData.stationName + " " + stationMapData.stationAddressLine2,
                "stationLatLng" : {"lat" : parseFloat(stationMapData.stationLatLng.lat), "lng" : parseFloat(stationMapData.stationLatLng.lng)},
                "stationID" : stationMapData.stationID
            });
        }); 
        return preparedMapData;
    };

    stationService.getStationLatLngPoints = function(destinationStationID, allStationsMapData){
        /*
         * This method takes in the stationID of a destination and searches the allStationsMapData array for that stationID.
         * If found, it returns the lat and lng points of that station.
         * We will use this after the directions form is submitted as the destinationStationID will be passed in from the select menu.
         *
         */
        var stationLatLng = {};
        allStationsMapData.forEach(function(stationMapData) {
           if(stationMapData.stationID == destinationStationID){
               //destinationStationID has been found in the array so get lat and lng points
               stationLatLng = stationMapData.stationLatLng;
           }

        }); 
        return stationLatLng;
    };

    stationService.getStationName = function(destinationStationID, allStationsMapData){
        /*
         * This method takes in the stationID of a destination and searches the allStationsMapData array for that stationName.
         * If found, it returns the name of that station.
         *
         */
        var stationName = '';
        allStationsMapData.forEach(function(stationMapData) {
           if(stationMapData.stationID == destinationStationID){
               //destinationStationID has been found in the array so get the station name
               stationName = stationMapData.stationName;
           }

        }); 
        return stationName;
    };

    stationService.getStationDetails = function(stationID){ 
        /**
         * This method makes a http GET request to our station Endpoint to retrieve details of a station based on a stationID
         * Each time the user chooses to view a station we call this method to get the data for that chosen station
         * so we can output it to the station.html view.
         * We return the stationDetails or if an error occurs we return null.
         */
        //Firstly define a variable self to reference "this".
        //We do it this way (instead of using bind) as it is more cross-browser compatible.
        var self = this; 

        return $http({
            method: 'GET',
           // url: 'http://localhost/API/station/' + stationID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            url: appFactory.appService.appDetails.appRootURL + '/API/station/' + stationID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
            headers: {
               'Content-Type': 'application/json;charset=utf-8'
            },
            responseType:'json'
        }).then(function successCallback(response){
            //Do checks to see if the response data is valid. If not valid then build the error notification
            var responseDataIsValid = false; //initialize boolean to false
            if(response.hasOwnProperty('data') && response.data !== null){
                //check if the data property is present in the response and it is not null
                if(response.data.hasOwnProperty('stationID') && response.data.stationID !== null){
                    //Check if the stationID property exists and also is not null in the response.
                    //This is the best way to determine whether the stationDetails were successfully generated. 
                    responseDataIsValid = true;
                }else{
                    sharedFactory.buildErrorNotification(response);
                }
            }else{
                //Either the data property is not present in the response, or it is present but it is null
                sharedFactory.buildErrorNotification(response);
            }

            //After the checks to see if the response is valid then store our station data from the API in the stationDetails object.
            if(responseDataIsValid){
                self.stationDetails = response.data;
                //calculate the average rating for this station (by looking at the rating in each review).
                var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data.reviews);

                //add the average rating as a property to the stationDetails object.
                self.stationDetails.averageRatingData = averageRatingData;
                //We need to alter the reviews array that comes back in the response so we can add a ratingInStars property to each review
                //We do this using the prepareReviews method of the reviewsFactory
                self.stationDetails.reviews = reviewFactory.reviewService.prepareReviews(response.data.reviews);
  
                //return the stationDetails to the controller
                return self.stationDetails;
            }else{
                //There has been an error. The controller is expecting the stationDetails returned from this method. We pass in null instead and check for null in controller.
                return null;
            }
        },function errorCallback(response){
            console.log('error');
            sharedFactory.buildErrorNotification(response);
            //There has been an error. The controller is expecting the stationDetails returned from this method. We pass in null instead and check for null in controller.
            return null;
        });
 	}; 

    stationService.createReview = function(stationID, userToken, reviewText, rating){
        /**
         * This method makes a http POST request to our createReview Endpoint to create a new review (for a particular station) with data entered by the user
         * We return the new review data and also store it into our stationDetails object.
         * If an error occurs we return null
         */
        var self = this; 
        var data = {
            "stationID" : stationID, 
            "userToken" : userToken,
            "reviewText" : reviewText,
            "reviewRating" : rating
        };
        return $http({
                method: 'POST',
               //url: 'http://localhost/API/createReview?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/createReview?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("reviews " + JSON.stringify(response.data));
                    var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data);
                    var reviews = reviewFactory.reviewService.prepareReviews(response.data); 
                    self.stationDetails.averageRatingData = averageRatingData;
                    self.stationDetails.reviews = reviews;
                    //create an object with the new reviews data to return from this method
                    var reviewsData = {"averageRatingData" : self.stationDetails.averageRatingData, "reviews" : self.stationDetails.reviews};
                    return reviewsData;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 

    stationService.editReview = function(reviewID, stationID, userToken, editedReviewText, newRating){
        /**
         */
        var self = this; 
        var data = {
            "stationID" : stationID, 
            "userToken" : userToken,
            "editedReviewText" : editedReviewText,
            "newRating" : newRating
        };
        return $http({
                method: 'PUT',
                //url: 'http://localhost/API/editReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/editReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("reviews " + JSON.stringify(response.data));
                    var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data);
                    var reviews = reviewFactory.reviewService.prepareReviews(response.data); 
                    self.stationDetails.averageRatingData = averageRatingData;
                    self.stationDetails.reviews = reviews;
                    //create an object with the new reviews data to return from this method
                    var reviewsData = {"averageRatingData" : self.stationDetails.averageRatingData, "reviews" : self.stationDetails.reviews};
                    return reviewsData;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 


    stationService.deleteReview = function(reviewID, stationID){
         /**
         * This method makes an API call to our deleteReview endpoint and deletes the review with a unique ID of reviewID
         * We pass in the ID of the station that the review belongs to so that we can get the new reviews array after the review is deleted
         * We need to send the userToken with this request. 
         */
        var self = this; 
        var data = {
            "userToken" : userFactory.userService.getUserToken(),
            "stationID" : stationID
        };
        return $http({
                method: 'DELETE',
             // url: 'http://localhost/API/deleteReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/deleteReview/' + reviewID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid  

                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("reviews " + JSON.stringify(response.data));
                    var averageRatingData = reviewFactory.reviewService.getAverageRating(response.data);
                    var reviews = reviewFactory.reviewService.prepareReviews(response.data); 
                    self.stationDetails.averageRatingData = averageRatingData;
                    self.stationDetails.reviews = reviews;
                    //create an object with the new reviews data to return from this method
                    var reviewsData = {"averageRatingData" : self.stationDetails.averageRatingData, "reviews" : self.stationDetails.reviews};
                    return reviewsData;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                console.log(JSON.stringify(response));
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 


    stationService.createReply = function(reviewID, userToken, replyText){
        /**
         */
        var self = this; 
        var data = {
            "reviewID" : reviewID, 
            "userToken" : userToken,
            "replyText" : replyText
        };
        return $http({
                method: 'POST',
               // url: 'http://localhost/API/createReply?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/createReply?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                if(responseDataIsValid){        
                    console.log("replies " + JSON.stringify(response.data));
                    console.log("self.stationDetails.reviews " + JSON.stringify(self.stationDetails.reviews));
                    var replies = response.data;
                    var currentReviewsArray = self.stationDetails.reviews;
                    //store the replies array that came back in the response in stationDetails reviews array for the review with ID of reviewID
                    //the scope will be automatically updated with the new reviews array now so need to return the array here
                    reviewFactory.reviewService.setReviewReplies(reviewID, currentReviewsArray, replies);
                    console.log("self.stationDetails.reviews2 " + JSON.stringify(self.stationDetails.reviews));
           
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 

    stationService.editReply = function(replyID, reviewID, userToken, editedReplyText){
        /**
         */
        var self = this; 
        var data = {
            "reviewID" : reviewID, 
            "userToken" : userToken,
            "editedReplyText" : editedReplyText
        };
        return $http({
                method: 'PUT',
                //url: 'http://localhost/API/editReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/editReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                 //console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our review data into our stationDetails object
                if(responseDataIsValid){        
                    console.log("replies " + JSON.stringify(response.data));
                    //the response data will be an array of replies (with the edited reply) for a particular review (with ID of reviewID).

                    var repliesArray = response.data;
                    var currentReviewsArray = self.stationDetails.reviews;
                    //call the setReviewReplies method (from the reviewFactory) in order to store the new replies array that comes back in the response
                    //into the review that it belongs to.
                    reviewFactory.reviewService.setReviewReplies(reviewID, currentReviewsArray, repliesArray);

                    //We return the new reviews array however currently we don't need to do this as the scope will update when the stationDetails object updates anyway
                    return self.stationDetails.reviews;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    };

    stationService.deleteReply = function(replyID, reviewID){
        /**
         * This method makes an API call to our deleteReply endpoint and deletes a reply comment (from a review) with a unique ID of replyID
         * We pass in the ID of the review that the reply comment belongs to so that we can regenerate the replies array after the comment is deleted
         * We need to send the userToken with this request. 
         */
        var self = this; 
        var data = {
            "userToken" : userFactory.userService.getUserToken(),
            "reviewID" : reviewID
        };
        return $http({
                method: 'DELETE',
               // url: 'http://localhost/API/deleteReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                url: appFactory.appService.appDetails.appRootURL + '/API/deleteReply/' + replyID + '?apiKey=1a0bca66-82af-475a-8585-90bc0417883d',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                responseType:'json'
            }).then(function successCallback(response){
                console.log(JSON.stringify(response));
                //Do checks to see if the response data is valid. If not valid then build the error notification
                var responseDataIsValid = false; //initialize boolean to false
                if(response.hasOwnProperty('data') && response.data !== null){
                    //check if the data property is present in the response and it is not null    
                    if(!response.data.hasOwnProperty('error')){     
                        //response does not have error property therefore it is valid       
                        responseDataIsValid = true;
                    }
                }
                //After the checks to see if the response is valid then store our reply data for this review into our stationDetails object
                if(responseDataIsValid){        
                    console.log("replies " + JSON.stringify(response.data));
                    //the response data will be an array of replies (minus the reply that was deleted) for a particular review (with ID of reviewID).

                    var repliesArray = response.data;
                    var currentReviewsArray = self.stationDetails.reviews;
                    //call the setReviewReplies method (from the reviewFactory) in order to store the new replies array that comes back in the response
                    //into the review that it belongs to.
                    reviewFactory.reviewService.setReviewReplies(reviewID, currentReviewsArray, repliesArray);
  
                    //We return the new reviews array however currently we don't need to do this as the scope will update when the stationDetails object updates anyway
                    return self.stationDetails.reviews;
                }else{
                    //The data is not valid (or there has been an error)
                    sharedFactory.buildErrorNotification(response);
                    return null;
                }
            },function errorCallback(response){
                sharedFactory.buildErrorNotification(response);
                return null;
            });
    }; 



    stationService.prepareGoogleMapsApi = function(callback){
        /* Before using the google object (i.e when preparing the google map and also when getting directions) 
         * we must check if the google api is fully loaded (otherwise there will be an error ("google" undefined) 
         * that can break the app from working on subsequent requests).
         * (in case the user was not online when they opened the app or the requests where made).
         */

        var deferred = $q.defer();
        var mapLoadedSuccessfully = false;
        //make sure the user is online before proceeding with loading the google map script (if not loaded already) and also running our callback.
        var userIsOnline = navigator.onLine;
        if(userIsOnline){
            if(mapsApiIsLoaded){
                callback();
            }else{
                var url = "http://maps.google.com/maps/api/js?key=AIzaSyAq3rgVX-gPP-1TWmUBER0f_E_tzGO_6Ng"; 
                stationService.loadScript(url, callback);
            }
        }else{
            //only resolve the promise if the map API did not load successfully.

            deferred.resolve(mapLoadedSuccessfully); 
            alert("No Internet Connection!");
        }
        return deferred.promise;
    };


    stationService.loadScript = function(url, callback){
        // Adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        script.onreadystatechange = callback;
        script.onload = callback;

        // Fire the loading
        head.appendChild(script);
    };

    stationService.prepareStationsOnMap = function(allStationsMapData, scope, location){ 
        /*
         * This method takes in data for all our station data and pinpoints the station locations on a google map with id of map.
         * We use this in our main controller after we have detected that the home view has finished loading.
         */
        var self = this;
        var deferred = $q.defer();

        var mapLoadedSuccessfully = false;

        //store the map and infowindow in global variables so we can retrieve it later if we want
        self.infoWindow = new google.maps.InfoWindow();

        self.map = new google.maps.Map(document.getElementById('map'),{
            zoom: 7,
            center: allStationsMapData[0].stationLatLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        });
   
        google.maps.event.addListenerOnce(self.map, 'tilesloaded', function(){

            mapLoadedSuccessfully = true;
            deferred.resolve(mapLoadedSuccessfully); 
          //  alert('tiles loaded ' +  mapLoadedSuccessfully);
            self.fixMapWhenLoaded(); 
            //document.getElementById('map').innerHTML = "";
        });
        var stationIcon = new google.maps.MarkerImage(appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_petrol_pump.png", null, null, null, new google.maps.Size(48,68));


        for(var i = 0; i < allStationsMapData.length; i++){
            (function(stationMapData){
                var infoWindowHTMLContent = self.generateInfoWindowContent(stationMapData.stationID, stationMapData.stationName, stationMapData.stationLatLng);
                var compiled = $compile(infoWindowHTMLContent)(scope);
                var marker = new google.maps.Marker({
                   // map: self.map,
                    position: stationMapData.stationLatLng,
                    stationID: stationMapData.stationID,
                    stationName: stationMapData.stationName,
                    icon: stationIcon,
                   // icon: 'http://localhost/phonegap_tut/images/icon.png',
                    content: compiled[0],
                });

                // Push your newly created marker into the array
                self.stationMarkers.push(marker);
      

                google.maps.event.addDomListener(marker, 'click', function(){
                    self.infoWindow.setContent(this.content);
                    self.infoWindow.open(self.map, this);
                    //store our info window details in case we need to retrieve them at another stage.       
                    self.infoWindowStationID = this.stationID;
                    self.infoWindowStationName = this.stationName;
                    self.infoWindowStationLatLng = this.position;

                });
            })(allStationsMapData[i]);

        }
                //set style options for marker clusters (these are the default styles)
        var mcOptions = {styles: [{
                        height: 75,
                        url: appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_marker_cluster.png",
                        width: 75,
                        textColor: '#ffffff',
                        //fontFamily:"Raleway",
                        textSize:14
                    }]};
        // create the markerClusterer
        var markerCluster = new MarkerClusterer(self.map, self.stationMarkers, mcOptions);
        console.log(markerCluster);
        
        $timeout(function() {
           // alert('timeout ' +  mapLoadedSuccessfully);
            if(!mapLoadedSuccessfully){
               // alert('timeout2 ' +  mapLoadedSuccessfully);
                deferred.resolve(mapLoadedSuccessfully);
            }
        }, 6000);

        return deferred.promise;

    };


        stationService.fixMapWhenLoaded = function() {
            /*
             * We need to target all external links within the google map so that we can open them in a new window instead of the
             * default behaviour.
             * Leaving the default behaviour causes the following problem when the app is packaged with phonegap:
             * The user clicks the external link but has no way to navigate back to the app.
             * By changing the default external link behaviour we can have the link open in an in-app browser window so that
             * they can navigate back to the app
             */

            //Now that the map has loaded, get all anchor links with href containing google.com 
            //These will be the "google" logo link, the "terms and conditions" link and the "report an error" link on the map
            var google_map_links = document.querySelectorAll("a[href*='google.com']");
            console.log(google_map_links);
            stationService.fixExternalLinks(google_map_links);


        };


        stationService.fixExternalLinks = function(external_links) {
            console.log(external_links);
            for(var i = 0; i < external_links.length; i++){
                //create a closure to add on click event listeners to each link
                (function(external_link){
                    external_link.addEventListener('click', function(event){
                        //prevent the default action on link click
                        event.preventDefault();
                        var href = external_link.getAttribute("href"); //get the href attribute of this element
                        //open the link in a new window (which will then allow the user to navigate back to the app)
                        var ref = window.open(href, '_blank', 'location=yes');
                    }, false);
                   console.log(external_link);
                })(external_links[i]);
            }
  
        };





    stationService.generateInfoWindowContent = function(stationID, stationName, stationLatLng){ 
        /*
         * This method prepares HTML for the content of the google map info winodw (i.e the popups that come up when you click 
         * on a marker).
         * This method is called in prepareStationsOnMap.
         */
        var infoWindowHTML = '<div class="info_window"><h4 class="station_name">' + stationName + '</h4>' + 
                             '<div class="info_window_button_area">' + 
                             '<a class="info_window_button btn btn_white" href="#station?stationID=' + stationID + '">View more info</a>' + 
                             '<span class="info_window_button btn btn_white" + data-ng-click="getDirections(' + stationID + ')">Get directions</span>' + 
                             '</div>' +
                             '</div>';

        return infoWindowHTML;
    };

    stationService.prepareCurrentLocation1 = function(){ 
        /*
         * This method gets a user's current position, marks it on the map
         * We also enter this current position to the From input field in our directions form
         */
        var self = this;
        for(var i = 0; i < self.currentPositionMarkers.length; i++){
            self.currentPositionMarkers[i].setMap(null);
        }
        var deferred = $q.defer();
        var isSuccessful = false;
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                function(position){
                    isSuccessful = true;
                    var currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    var currentLocationIcon = new google.maps.MarkerImage(appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_user.png", null, null, null, new google.maps.Size(48,68));


                    var currentPositionMarker = new google.maps.Marker({
                        position: currentPosition, 
                        map: self.map, 
                        title:"User location",
                        icon: currentLocationIcon,
                       // icon: 'http://localhost/phonegap_tut/images/you_icon.png',
                        optimized: false,
                        zIndex:99999999
                    }); 
                    // Push your newly created marker into the array
                    self.currentPositionMarkers.push(currentPositionMarker);
                    //return the current position. This will be an object with lat and lng points.
                    deferred.resolve(currentPosition); 
                },
                function(error) {
                    var errors = { 
                        1: 'Permission denied',
                        2: 'Position unavailable',
                        3: 'Request timeout'
                    };
                    if(errors[error.code] == 'Permission denied'){
                        //alert("Error: Current location inaccessible. Please ensure location services are enabled in the settings on your device."); 
                    }else{
   
                        //alert("Error: " + errors[error.code] + ". Please enter your starting position in the form to get directions");
                    }  
                    deferred.resolve(null);    
                },
              { enableHighAccuracy: true, timeout: 5900, maximumAge: 0 }
            );
            $timeout(function() {
                //After two seconds check if the isSuccessful boolean is still false and if so then 
                //we know the success callback has not been executed so we can resolve the promise passing in null
                if(!isSuccessful){
              
                    deferred.resolve(null);
                }
            }, 6000);


        }else{
            deferred.resolve(null); 
            alert("Please enter your starting position in the form to get directions");
        }
        return deferred.promise;
    };

    stationService.prepareCurrentLocation = function(){ 
        /*
         * This method calls the getCurrentPosition method from the geolocationFactory to get a user's current position
         * If successfully retrieved we mark their current position on the map (with id of "map")
         * and return the current position from the method with a promise.
         * If unsuccessful we return null.
         */
        var self = this;
        for(var i = 0; i < self.currentPositionMarkers.length; i++){
            self.currentPositionMarkers[i].setMap(null);
        }
  
        var deferred = $q.defer();
        var isSuccessful = false; //initialize a boolean which will tell us whether the success function has been executed or not.
          // alert("prepareCurrentLocation");
            geolocationFactory.getCurrentPosition(
                function(position){
                    isSuccessful = true;

                    var currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    var currentLocationIcon = new google.maps.MarkerImage(appFactory.appService.appDetails.appRootURL + "/map_server_files/images/gm_icon_user.png", null, null, null, new google.maps.Size(48,68));


                    console.log(JSON.stringify(currentPosition));

                    var currentPositionMarker = new google.maps.Marker({
                        position: currentPosition, 
                        map: self.map, 
                        title:"User location",
                        icon: currentLocationIcon,
                       // icon: 'http://localhost/phonegap_tut/images/you_icon.png',
                        optimized: false,
                        zIndex:99999999
                    }); 
                    // Push your newly created marker into the array
                    self.currentPositionMarkers.push(currentPositionMarker);
                    //return the current position. This will be an object with lat and lng points.
                    deferred.resolve(currentPosition); 
                },
                function(error) {
                    //we will output a message to the user in the controller as
                    //a different message will be output depending on when this method is called
                    deferred.resolve(null);    
                },
                { enableHighAccuracy: true, timeout: 5900, maximumAge: 0 }
            );
            //Note: After testing with phonegap it seems the error function is sometimes not being called here 
            //for example when a user has location turned off on their device so 
            //we need another way to return null (from the promise) if the success function is not called.
            //we do this with a timeout.
            $timeout(function() {
                //After two seconds check if the isSuccessful boolean is still false and if so then 
                //we know the success callback has not been executed so we can resolve the promise passing in null
                if(!isSuccessful){
                    //alert('stationfactory getcurrentloc timeout');
                    deferred.resolve(null);
                }
            }, 6000);
        return deferred.promise;
    };

    stationService.getDirections = function(startLocation, viaPoint, travelMode, destinationStationID){ 
        
        var self = this;
        var deferred = $q.defer();
        var via = viaPoint;
        if (travelMode == 'TRANSIT') {
            via = '';  //if the travel mode is transit, don't use the via waypoint because that will not work
        }

        //get the lat and lng points of the station with stationID of destinationStationID.
        var destinationLatLng = self.getStationLatLngPoints(destinationStationID, self.allStationsMapData);
        //get the station name of the station with stationID of destinationStationID.
        var stationName = self.getStationName(destinationStationID, self.allStationsMapData);

        var directionsDetails = {};
        if(travelMode === "TRANSIT"){
            directionsDetails.travelMode = "Public transport";
        }else{
            directionsDetails.travelMode = travelMode;
        }
        directionsDetails.stationName = stationName;
        
        var waypoints = []; // init an empty waypoints array
        if (via != '' && via != null) {
            //if waypoints (via) are set, add them to the waypoints array
            waypoints.push({
                location: via,
                stopover: true
            });
        }
        var request = {
            origin: startLocation,
            destination: destinationLatLng,
            waypoints: waypoints, //delete this if via is not used
            unitSystem: google.maps.UnitSystem.IMPERIAL,
            travelMode: google.maps.DirectionsTravelMode[travelMode]
        };

        //check first that the user is online.
        var userIsOnline = navigator.onLine;
        if(userIsOnline){
            //reset the directionsDisplay if it is already set (e.g from previous direction results)
            if(self.directionsDisplay != null){
                self.directionsDisplay.setMap(null);
                self.directionsDisplay = null;
            }

            self.directionsDisplay = new google.maps.DirectionsRenderer();
            self.directionsDisplay.setMap(self.map);
            self.directionsDisplay.setOptions( { suppressMarkers: true } );
            self.directionsDisplay.setPanel(document.getElementById("directions_panel"));

            self.directionsService = new google.maps.DirectionsService();
            self.directionsService.route(request, function(response, status){
                // alert('route called');
                if(status == google.maps.DirectionsStatus.OK){
                    // alert('status ok');
                    document.getElementById("directions_panel").innerHTML = "";
                    self.directionsDisplay.setDirections(response);
                    deferred.resolve(directionsDetails);
                }else{
                    // alert('status not ok');
                    // alert an error message when the route could not be calculated.
                    if(status == 'ZERO_RESULTS'){
                        alert('No route could be found between the origin and destination. \n\nPlease make sure the origin, destination, and via waypoints are correct locations.');
                    }else if(status == 'UNKNOWN_ERROR'){ 
                        alert('A directions request could not be processed due to a server error. \n\nPlease check your internet connection.');
                    }else if(status == 'REQUEST_DENIED'){
                        alert('This application is not allowed to use the directions service. \n\nPlease contact support!');
                    }else if(status == 'OVER_QUERY_LIMIT'){
                        alert('The application has gone over the requests limit in too short a period of time.\n\nPlease contact support!');
                    }else if(status == 'NOT_FOUND'){
                        alert('At least one of the origin, destination, or via waypoints could not be geocoded. \n\nPlease make sure the start location or via point are correct locations.');
                    }else if(status == 'INVALID_REQUEST'){
                        alert('The Directions Request provided was invalid.');                  
                    }else{
                        alert("There was an unknown error in your request. Request status: \n\n" + status);
                    }
                    deferred.resolve(null);
                }
            });
        }else{
            deferred.resolve(null);
            alert("No Internet Connection!");
        }
        return deferred.promise;
    };


    stationService.checkForReviews = function(){ 
        /*
         * This method checks to see if the current station has any reviews 
         * i.e. if the reviews property of the stationDetails object is populated or not
         * It returns a boolean.
         * we call this method in the stationController.
         */
        if(this.stationDetails.reviews.length){
            return true;
        }else{
            return false;
        }
    };


    stationService.checkUsersReviewStatus = function(){ 
        /*
         * This method checks to see if the current user has written a review for the current station or not.
         * It returns a boolean.
         * we call this method in the stationController.
         */
        var userHasReviewedStation = false;
        var currentUserID = userFactory.userService.userDetails.userID;
        //loop through the reviews array to check the userID of each review against current userID.
        this.stationDetails.reviews.forEach(function(review) {
            if(review.reviewUserData.userID === currentUserID){
                userHasReviewedStation = true;
            }
        }); 
        console.log("userHasReviewedStation " + userHasReviewedStation);
        return userHasReviewedStation;
    };

    //return public API so that we can access it in all controllers
    return{
        stationService: stationService
    };
});