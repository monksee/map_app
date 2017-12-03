//create the homeController for the home.html view
mapApp.controller("homeController", function($scope, stationFactory){
	$scope.pageHeading = ""; //this will be inserted to a h2 tag
	$scope.introParagraph = ""
	
	$scope.selectMarker = function(){
		console.log('marker selected');
	};



});



