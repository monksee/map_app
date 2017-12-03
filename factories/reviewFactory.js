/*
 * This factory consists of objects and methods which will process data associated with the reviews (and their replies) and ratings of the stations.
 */
mapApp.factory('reviewFactory', function($http, sharedFactory){
    "use strict";
    var reviewService = {};
    

    reviewService.prepareReviews = function(reviewsArray){ 
        /*
         * This method takes in an array of reviews for a particular station and prepares the reviews for output to the html.
         * We firstly filter the reviewText property (and also the replies array) to add a span tag whenever a new line occurs in the text.
         * We also add a property called ratingInStars to each review.
         * We will use this ratingInStars array in the view in order to display stars for each review using ng-repeat.
         * From this method, we return the reviewsArray with the prepared data.
         */
        var self = this; 
        reviewsArray.forEach(function(review) {
            review.originalReviewText = review.reviewText;
            review.reviewText = self.filterTextForLineBreaks(review.reviewText);
            review.replies = self.prepareReviewReplies(review.replies);
            review.ratingInStars = self.prepareRatingInStars(review.reviewRating);
            console.log("prep" + review.originalReviewText);
        }); 
        return reviewsArray;
    };

    reviewService.prepareReviewReplies = function(repliesArray){ 
        /*
         * This method takes in an array of replies for a particular review of a station and filters the replyText property
         * for the new line character so it can be displayed properly.
         */
        var self = this; 
        repliesArray.forEach(function(reply) {
            reply.originalReplyText = reply.replyText;
            reply.replyText = self.filterTextForLineBreaks(reply.replyText);

        }); 
        return repliesArray;
    };



    reviewService.setReviewReplies = function(reviewID, reviewsArray, repliesArray){ 
        /*
         * This method sets the replies array for a particular review of a station.
         * We will use this method in such cases where a review reply has been deleted or edited.
         */
        var self = this; 
        reviewsArray.forEach(function(review) {
            if(review.reviewID === reviewID){
                //set the replies to equal the new replies array
                review.replies = self.prepareReviewReplies(repliesArray);

            }
        }); 
        return reviewsArray;
    };


    reviewService.getAverageRating = function(reviewsArray){ 
        /*
         * This method takes in an array of reviews for a particular station and calculates the average rating for that station.
         * We return an object called averageRatingData which contains the number of ratings, the average rating and an array called ratingInStars
         */

        var averageRatingData = {};
        var sumOfRatings = 0;
        var averageRating = 0;
        //count the reviews array to get the total number of ratings (as each review will have a rating.)
        var numberOfRatings = reviewsArray.length;

        if(numberOfRatings > 0){
            //Make sure there are ratings before getting the following calculations otherwise there will be an error 
            //if we call this function and the reviews array is empty.
            reviewsArray.forEach(function(review) {
                //was doing sumOfRatings += review.reviewRating; but this was concatenating the values as a string so need to do the following 
                //to ensure the values are added up as numbers.
                sumOfRatings = +sumOfRatings + +review.reviewRating;        
            }); 
            var averageRating = sumOfRatings/numberOfRatings;
            //round the averageRating down to the nearest half integer and store it into the averagaRatingData object that we will return
            averageRatingData.averageRating = Math.round(averageRating * 2)/2;
            averageRatingData.ratingInStars = this.prepareRatingInStars(averageRatingData.averageRating);
            averageRatingData.numberOfRatings = numberOfRatings; //store the numberOfRatings into the object that we will return
        }

        return averageRatingData;
    };

    reviewService.prepareRatingInStars = function(rating){
        /*
         * This method takes in a rating which will be a number between 1 and 5 inclusive.
         * It returns an array of objects which will tell us whether a star if full (fa-star), half (fa-star-half-o) or empty (fa-star-o).
         * We will use this array of objects with ng-repeat in the view in order to display the stars
         */
        var ratingInStarsArray = [];
        var numberOfEmptyStars = 0; //initialize to 0 
        var countFullStars = Math.round(rating); //round the rating down to the nearest whole number to get number of full stars

        //add the full stars onto the array
        for(var x = 0; x < countFullStars; x++){
            ratingInStarsArray.push({starClass : "fa-star"});          
        }

        //check if the rating has a decimal place so we can add a half star if needed
        if(rating % 1 != 0){
            //There is a decimal place so therefore we need to add a half star onto the array.
            ratingInStarsArray.push({starClass : "fa-star-half-o"});
        }
        //Now that the full stars and half stars are added to the array we need to check if we need to add any empty stars
        //the number of empty stars to add will be 5 minus the current length of the array we are creating
        numberOfEmptyStars = 5 - ratingInStarsArray.length; 

        //add any empty stars to the array
        for(var x = 0; x < numberOfEmptyStars; x++){
            ratingInStarsArray.push({starClass : "fa-star-o"});
        }
        //make sure this array has maximum five elements
        ratingInStarsArray = ratingInStarsArray.slice(0, 5);

        return ratingInStarsArray;
    };

    reviewService.filterTextForLineBreaks = function(text){
        /*
         * This method takes in text and inserts a span tag whenever we find a line break in order to display the content
         * correctly in the HTML.
         */   
        var filteredText = '';
        var textArray = text.split("\n");
        textArray.forEach(function(lineOfText) {
            var tempLineOfText = lineOfText;
            filteredText += tempLineOfText + '<span class="small_break_between_paragraphs"></span>'; 
        });
        return filteredText;
    };

    //return public API so that we can access it in all controllers
    return{
        reviewService: reviewService
    };
});