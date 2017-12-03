/*
 * A factory that makes calls to PhoneGap's geolocation API.
 */
mapApp.factory('geolocationFactory', function ($rootScope, phonegapReady) {
    return {
        //we want to wrap our implementation in our phonegapReady function in case deviceready has not fired yet.
        //If deviceready has not fired then this call will be put in a queue until it fires.
        getCurrentPosition: phonegapReady(function (onSuccess, onError, options) {
            navigator.geolocation.getCurrentPosition(function () {
                var that = this,
                args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            },function () {
                var that = this,
                args = arguments;
                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            },
            options);
        })
    };
});