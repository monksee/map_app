/*
 * This factory checks for the phonegap deviceready event.
 * We create a wrapper that will queue up PhoneGap API calls if called before deviceready 
 * and call them after deviceready fires. 
 * After deviceready has been called, the API calls will occur normally.
 * Throughout the app we should wrap any calls that depend on deviceready being fired in this phonegapReady function.
 */
mapApp.factory('phonegapReady', function() {
    return function (fn) {
        var queue = [];

        var impl = function () {
            queue.push(Array.prototype.slice.call(arguments));
        };
        document.addEventListener('deviceready', function () {
            queue.forEach(function (args) {
                fn.apply(this, args);
            });
            impl = fn;
        }, false);

        return function () {
            return impl.apply(this, arguments);
        };
    };
});