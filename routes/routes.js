//configure our routes
mapApp.config(function($routeProvider) {
	$routeProvider
	    .when('/login', {
			//route for the login page
			templateUrl : 'views/login.html',
			controller : 'loginController'
		})
		.when('/', {
			//route for the home page
			templateUrl : 'views/login.html',
			controller : 'loginController'
		})
		.when('/home', {
			//route for the home page
			templateUrl : 'views/home.html',
			controller : 'homeController'
		})
		.when('/station', {
			//route for the station page
			templateUrl : 'views/station.html',
			controller : 'stationController'
		});
});