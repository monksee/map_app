

//create the stationController for the station.html view
mapApp.controller("stationController", function($scope, $timeout, $routeParams, $location, stationFactory, userFactory, reviewFactory, validatorFactory, sharedFactory){


    $scope.stationDetails =  {};

    //create a scope variable in order to determine when our station data is loaded into scope
    //so that we can display a loading symbol in the view before hand.
    $scope.dataIsSet = false;

    //create a variable to indicate whether the review form is displayed or not.
    //We will set it to true if a user chooses to "write a review"
    $scope.displayReviewForm = false;

    //There will just be one main review form in the station view so we create an object to store the form data.
    $scope.reviewFormData = {};
    $scope.reviewFormData.rating = 0; //initialize the rating value of the form to 0.

    //There will be multiple edit review forms (one for each review) in the station view so we will store the data in a zero based indexed array.
    //Each element of this array will be an object which will hold a text and rating property for that review.
    $scope.editReviewFormData = [];

    //create a variable which stores the index of the edit_review form which is currently selected.
    //Initialize it to -1
    $scope.selectedReviewForEdit = -1; 

    //There will be multiple edit reply forms for each review in the station view so we will store the data in a zero based indexed array.
    //This will be an array of arrays as we will have an array of replies for each review.
    $scope.editReplyFormData = [];

    //We create an array where the indexes will correspond to the indexes of the reviews 
    //The elements will be the index of the reply within that review.
    //We will use this with ng-show to display selected edit_reply forms
    $scope.selectedReplyEditForms = [];

    //There will be one reply form underneath each review (for users with the right permissions)
    //so create an array to hold the form data. The indexes of this array will correspond to the indexes of the reviews 
    $scope.replyFormData = [];



    $scope.messageForUser = "";
    $scope.displayMessageForUser = false;
    (function() {
	    if($routeParams.stationID == null || $routeParams.stationID === ""){
		    //If the stationID is not set or if it doesnt contain a value (i.e is the empty string) then redirect to the home page.
            //This will also return true if stationID is undefined. 
		    $location.path('home'); 
        }else{ 
            stationFactory.stationService.getStationDetails($routeParams.stationID).then(function(stationDetails) {
                //if an error occurs in the http request (in the getStationDetails method of the stationFactory) we pass in null as the returned value from the promise
                //Therefore we can check now if the value of stationDetails is null and redirect to the home page if it is.
                if(stationDetails !== null){
                    //stationDetails returned from the promise is not null so we store them in scope.
      	            $scope.stationDetails = stationDetails;
                    $scope.dataIsSet = true;
                }else{
                    //stationDetails value will be null if an error occurred in http request
                    //redirect to home page.
                    $location.path('home'); 
                }
            });
        }
    })();

    $scope.checkForUserPrivileges = function(creatorUserID){
        /*
         * This method takes in the userID of the creator of a particular review or the reply of a review.
         * It checks if the current user is the creator of the review comment.
         * We use this along with ng-show in our station view to show the edit review button.
         */

        var currentUserID = userFactory.userService.userDetails.userID;
        if(currentUserID === creatorUserID){
            return true;
        }else{
            return false;
        }
    }; 
    $scope.checkForHigherUserPrivileges = function(creatorUserID){
        /*
         * This method takes in the userID of the creator of a particular review or the reply of a review.
         * It checks if the current user is an administrator or if the current user is the creator of the review or reply.
         * If either of these is true then we return true
         * We use this along with ng-show in our station view to show certain elements.
         */
        var currentUserID = userFactory.userService.userDetails.userID;
        var isAdmin = userFactory.userService.checkIfUserIsAdmin();
        if(isAdmin || (currentUserID === creatorUserID)){
            return true;
        }else{
            return false;
        }
    };
    $scope.checkForReviews = function(){
        /*
         * This method checks to see if there are any reviews for this station 
         */
        return stationFactory.stationService.checkForReviews();
    }; 
    $scope.checkUsersReviewStatus = function(){
        /*
         * This method checks to see if the current user has written a review for this station or not.
         * It returns a boolean.
         */
        return stationFactory.stationService.checkUsersReviewStatus();
    }; 



    $scope.displayWriteAReviewButton = function(){
        /*
         * This method checks to see if we should display (with ng-show) the "write a review" button or not.
         * We will show the button, if the review form is not currently displayed and also the user has not written 
         * a review for a particular station before.
         */
        if(!$scope.displayReviewForm && !$scope.checkUsersReviewStatus()){
            //if the write a review form is not currently displaying and a user has not written a review for this station before
            //then return true (to display the "write a review" button)
            return true;
        }else{
            return false;
        }
    };

    $scope.writeAReview = function(){
        /*
         * This method is called when the "Write a review" button is clicked.
         * It firstly checks to see if a user is logged in. If they are logged in then we can show the review form.
         * Note: A user must be logged in before they can submit a review.
         */
        var isLoggedIn = userFactory.userService.checkIfUserIsLoggedIn();
        if(!isLoggedIn){
            //the user is not logged in so we show the facebook login dialog and do processing there.
            $scope.loginWithFacebook().then(function(loginIsSuccessful){
                console.log('t' + loginIsSuccessful);
                if(loginIsSuccessful){
                    //if login is successful then check if this user has written a review for this station already
                    if(!$scope.checkUsersReviewStatus()){
                        //user has not written a review so display the review form.
                        $scope.displayReviewForm = true;
                    }else{
                        //user has already written a review for this station.
                        //output message
                        $scope.messageForUser = "You have already written a review for this station.";
                        $scope.displayMessageForUser = true;
                        $timeout(function() {
                            $scope.displayMessageForUser = false;

                        }, 3000);
                    }
                }else{
                    alert("We're sorry but you have not been logged in successfully and therefore cannot write a review");

                }
            });
        }else{
            $scope.displayReviewForm = true;
        }

    }; 

    $scope.selectStar = function(rating){
        /*
         * This method is called when a star (with the review form stars) is clicked i.e a rating is selected.
         * The value passed in to this function will be 1 to 5 inclusive.
         */
        $scope.reviewFormData.rating = rating;
    };



    $scope.submitReview = function(stationID){
        /*
         * This method is called when the review from is submitted
         * The review form will only be visible if a user has logged in so no need to check if user is logged in here.
         */
        if($scope.reviewFormData.text == null){
           //If $scope.reviewFormData.text is undefined it means there is no text in the textarea so break out of the function.
           //There will be an error message displayed in the form already so no need to output error here.
           return;
        }

        var reviewText = $scope.reviewFormData.text; //our ng-model variable
        var rating = $scope.reviewFormData.rating; 
        var userToken = userFactory.userService.getUserToken(); //get userToken from local storage.

        //use validator factory to validate the length of the input.
        var inputsAreValid = validatorFactory.checkInputLengthsAreValid(
            [{"input" : reviewText, "minLength" : 10, "maxLength" : 2000}]);

        if(inputsAreValid && (rating > 0 && rating <=5)){
            //inputs are valid and rating is valid so we can proceed
            console.log("stationID " + stationID);
            console.log("userToken " + userFactory.userService.getUserToken());
            console.log("inputsAreValid" + inputsAreValid);
            console.log("valid" + reviewText);
            console.log("valid" + $scope.reviewFormData.rating);

            //create review and get back all of the reviews data for this station.
            stationFactory.stationService.createReview(stationID, userToken, reviewText, rating).then(function(reviewsData){
                //remove the review form 
                $scope.displayReviewForm = false;
                $scope.resetReviewFormValues();
               // $scope.stationDetails.reviews = reviewsData.reviews;
                                 console.log(JSON.stringify(reviewsData));
            });
        }
    };


    $scope.resetReviewFormValues = function(){
        /*
         * This method resets our review form values.
         * We call this after a review has been submitted so that the form is clear if a user chooses to write a review on another station.
         */
        $scope.reviewFormData = {}; //our ng-model for the review form is called review so reset this.
        $scope.reviewFormData.rating = 0; //reset the rating
        $scope.review_form.$setPristine();
        $scope.review_form.$setUntouched();
    }; 

    $scope.cancelWriteAReview = function(){
        /*
         * This method is called when a user chooses to cancel writing a review (so that the review form can be then hidden again)
         */
        $scope.displayReviewForm = false;
        $scope.resetReviewFormValues();
    };

    $scope.deleteReview = function(reviewID, stationID){
        /*
         * This method is called when a user chooses to delete a review.
         * The delete review button will only be shown (with ng-show) to the user if the current userID (from userDetails) is equal to the userID
         * of the review creator so no need to check privileges here.
         */
        var confirmation = confirm("Are you sure you want to delete this review?");
        if(confirmation){
            //remove any edit review forms that are displaying.
            $scope.selectedReviewForEdit = -1; 
            stationFactory.stationService.deleteReview(reviewID, stationID);
        }
    }; 


    /*Methods for editing a review*/
    $scope.displayEditReviewForm = function(reviewIndex, originalReviewRating, originalReviewText){
        /*
         * This method is called when a user chooses to edit a review (by clicking the pencil icon).
         * The edit review button will only be shown (with ng-show) to the user if the current userID (from userDetails) is equal to the userID
         * of the review creator so no need to check privileges here.
         * We take in (as parameters) the original rating and original review text so that we can display them in the form to be edited.
         * We also pass in the index of the review so that we can display that paricular form.
         */
        //A form should be displayed to the user now.
        $scope.selectedReviewForEdit = reviewIndex; 
        //the editReviewFormData array is defined already so now create an object at index of reviewIndex
        //Set the text and rating of the form to be the original text and also the original rating respectively
        $scope.editReviewFormData[reviewIndex] = {
            text : originalReviewText,
            rating : originalReviewRating
        };
        console.log("edit review form data " + JSON.stringify($scope.editReviewFormData));
    };

    $scope.selectStarForEdit = function(reviewIndex, rating){
        /*
         * This method is called when a star (with the review form stars) is clicked i.e a rating is selected.
         * The value passed in to this function will be 1 to 5 inclusive.
         */

        $scope.editReviewFormData[reviewIndex].rating = rating; 
    };

    $scope.submitEditedReview = function(reviewIndex, reviewID, stationID){
        /*
         * This method is called when the edited review from is submitted
         */
        if($scope.editReviewFormData[reviewIndex].text == null){

           //If $scope.editReviewFormData.text (our ng-model variable) is undefined it means there is no text in the textarea so break out of the function.
           //There will be an error message displayed in the form already so no need to output error here.
           return;
        }
        //get the text and rating from our ng-model object 
        var editedReviewText = $scope.editReviewFormData[reviewIndex].text; 
        var newRating = $scope.editReviewFormData[reviewIndex].rating;

        var userToken = userFactory.userService.getUserToken(); //get userToken from local storage.

        //use validator factory to validate the length of the input.
        var inputsAreValid = validatorFactory.checkInputLengthsAreValid(
            [{"input" : editedReviewText, "minLength" : 10, "maxLength" : 2000}]);

        if(inputsAreValid && (newRating > 0 && newRating <=5)){
            //inputs are valid and rating is valid so we can proceed
            //edit the review and get back all of the reviews data for this station.
            stationFactory.stationService.editReview(reviewID, stationID, userToken, editedReviewText, newRating).then(function(reviewsData){
                //remove the edit form from view
                $scope.selectedReviewForEdit = -1; 
                //the reviews array will be already updated in scope 
                //because it comes from the stationDetails object in the factory so we dont need to do it here.
            });
        }else{
            //inputs are not valid 
        }
    };

    $scope.cancelReviewEdit = function(){
        $scope.selectedReviewForEdit = -1; 
    };

    $scope.displayEditReplyForm = function(reviewIndex, replyIndex, originalReplyText){
        /*
         * This method is called when a user chooses to edit a reply (by clicking the pencil icon).
         * The edit reply button will only be shown (with ng-show) to the user if the current userID (from userDetails) is equal to the userID
         * of the reply creator so no need to check privileges here.
         * We take in (as parameters) the original reply text so that we can display it in the form to be edited.
         * We also pass in the reviewIndex and replyIndex of this reply so that we can create the data scope object..
         */
        if (typeof $scope.editReplyFormData[reviewIndex] == "undefined" || !($scope.editReplyFormData[reviewIndex] instanceof Array)) {
            //If the array does not already exist then declare it here.
            $scope.editReplyFormData[reviewIndex] = [];
        }
        //Store the originalReplyText into our ng-model
        //We could not do the following unless we declared the array first (as above)
        $scope.editReplyFormData[reviewIndex][replyIndex] = {
            text : originalReplyText
        };
        //The following variable is used with ng-show in order to display the edit form for the selected reply.
        $scope.selectedReplyEditForms[reviewIndex] = replyIndex; 
        console.log("edit reply form data " + JSON.stringify($scope.editReplyFormData[reviewIndex]));
        console.log("edit reply form data " + JSON.stringify($scope.editReplyFormData));
    };


    $scope.submitEditedReply = function(replyID, reviewID, reviewIndex, replyIndex){
        console.log("submitted");
        if($scope.editReplyFormData[reviewIndex][replyIndex].text == null){
            //If $scope.editReplyFormData[reviewIndex][replyIndex].text (our ng-model variable) is undefined 
            //it means there is no text in the textarea so break out of the function.
            $scope.cancelReplyEdit(reviewIndex);
            return;
        }
        //get the text from our ng-model object 
        var editedReplyText = $scope.editReplyFormData[reviewIndex][replyIndex].text; 
        var userToken = userFactory.userService.getUserToken(); //get userToken from local storage.

        //use validator factory to validate the length of the input.
        var inputsAreValid = validatorFactory.checkInputLengthsAreValid(
            [{"input" : editedReplyText, "minLength" : 5, "maxLength" : 2000}]);

        if(inputsAreValid){
            //inputs are valid so we can proceed
            //edit the reply and get back all of the replies data.
            stationFactory.stationService.editReply(replyID, reviewID, userToken, editedReplyText).then(function(repliesData){
                //reset the edit reply form selected index so that it is not showing anymore
                $scope.selectedReplyEditForms[reviewIndex] = -1; 
 
                //the replies array will be already updated in scope 
                //because it comes from the stationDetails object in the factory so we dont need to do it here.
            });
        }else{
            //inputs are not valid 
        }
    };



    $scope.cancelReplyEdit = function(reviewIndex){

        $scope.selectedReplyEditForms[reviewIndex] = -1; 
        
    };

    
    $scope.submitReply = function(reviewIndex, reviewID){
        /*
         */
        if($scope.replyFormData[reviewIndex].text == null){
       
           return;
        }
        var replyText = $scope.replyFormData[reviewIndex].text; //our ng-model variable
        var userToken = userFactory.userService.getUserToken(); //get userToken from local storage.

        //use validator factory to validate the length of the input.
        var inputsAreValid = validatorFactory.checkInputLengthsAreValid(
            [{"input" : replyText, "minLength" : 5, "maxLength" : 2000}]);

        if(inputsAreValid){
            //inputs are valid so we can proceed
            stationFactory.stationService.createReply(reviewID, userToken, replyText).then(function(){
                $scope.replyFormData[reviewIndex] = {};
            });
        }

        
    }; 

    $scope.deleteReply = function(replyID, reviewID, reviewIndex){
        /*
         * This method is called when a user chooses to delete a reply of a review.
         * The delete reply button will only be shown (with ng-show) to the user if the current userID (from userDetails) is equal to the userID
         * of the reply creator so no need to check privileges here.
         */
        var confirmation = confirm("Are you sure you want to delete this comment?");
        if(confirmation){
            console.log($scope.selectedReplyEditForms[reviewIndex]);
            //reset any reply edit forms that are showing for this review
            $scope.selectedReplyEditForms[reviewIndex] = -1; 
            console.log(reviewID);
            stationFactory.stationService.deleteReply(replyID, reviewID);
        }
    }; 
});


