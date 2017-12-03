/*
 * This factory contains methods which will be used to validate user input or input from external APIs like the facebook connect plugin. 
 */
mapApp.factory('validatorFactory', function(){

    var validateFacebookInputs = function(inputArray){
        /*
         * This method takes in an array of input objects of our facebook user details and checks if they are valid
         */
        //First check if the lengths of the inputs are valid
        var lengthsAreValid = checkInputLengthsAreValid(inputArray);
        if(lengthsAreValid){
            //if the lengths are valid then check if the inputs are valid against their regular expressions.
            var inputsAreValid = validateInputsWithRegex(inputArray);
     
        }
        return inputsAreValid;
        // console.log("valid input " + inputsAreValid);
    };

    var checkInputLengthIsValid = function(inputObject){
        /*
         * This method takes in an object which has a input, minLength and maxLength property.
         * It checks if the length of the input is within the minLength and maxLength limits
         * We will use this method for checking all inputs within the app.
         */
        var inputLength = inputObject.input.length;
        if(inputLength >= inputObject.minLength && inputLength <= inputObject.maxLength){ 
            //The length of the input is valid.
            return true;    
        }else{
            return false; 
        }
    };
    

    var checkInputLengthsAreValid = function(inputArray){
        /*
         * This method takes in an array of input objects (each of which have a input, minLength and maxLength property).
         * It returns true if all of the inputs length are valid and false if any of them are invalid.
         */

        var lengthsAreValid = true;
        inputArray.forEach(function(inputObject){
            var lengthIsValid = checkInputLengthIsValid(inputObject);

            if(!lengthIsValid){ 
                lengthsAreValid = false;    
            }     
        });
        return lengthsAreValid;
    };

    /* 
     * Methods for validating inputs with regex
     */
    var validateInput = function(inputValue, regularExpression){
        /*
         * This method tests an input value against a regular expression defined for that input type.
         * We will use this for only some of the inputs within the app.
         */
        var inputIsValid = regularExpression.test(inputValue);
        return inputIsValid;
    };
    var validateInputsWithRegex = function(inputArray){
        /*
         * This method takes in an array of input objects.
         * The purpose of this method is to see if any of the objects have a regex property.
         * and if they do then we want to validate the input against the regex.
         * We return true if all input objects in the array are valid and false if any are invalid.
         */

        var inputsAreValid = true;
        inputArray.forEach(function(inputObject){
            //as some of the inputObjects dont have a regex property we want them to return true for validity
            //so we assign inputIsValid to true (by default) for each inputObject.
          
            var inputIsValid = true; 
            if(inputObject.hasOwnProperty('regex')){
        
                inputIsValid = validateInput(inputObject.input, inputObject.regex);

            }

            if(!inputIsValid){ 
                inputsAreValid = false;    
            }     
        });
        return inputsAreValid;
    };
    

  	//return public API so that we can access it in all controllers
  	return{
      validateFacebookInputs: validateFacebookInputs,
      checkInputLengthsAreValid: checkInputLengthsAreValid
 	  };
});