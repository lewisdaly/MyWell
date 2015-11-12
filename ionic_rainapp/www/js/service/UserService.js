angular.module('service.user', [])
.service('UserService', function($http, $q, $rootScope, apiUrl) {

	return({
		getUser: getUser,
		getUserDetails: getUserDetails,
		getCurrentUserID: getCurrentUserID
	});


	//Gets any user
	function getUser(userID) {
		//If we haven't specified a user, return the current user
		if (!userID || userID === -1){userID = getCurrentUserID();}


		var baseUrl = apiUrl;

		return $http({
			method: "get",
			headers: {'Content-Type': 'application/json'},
	      	url: baseUrl + "/api/user/" + userID
		})
		.success(function(data) {

		})
		.error(function() {

		});
	}

	//Gets the details for the current logged in user
	function getUserDetails() {
		var baseUrl = apiUrl;

		return $http({
			method: "get",
			url: baseUrl + "/api/user/current"
		})


	}

	//Private Methods
	function getCurrentUserID() {
		var currentUser = $rootScope.globals.currentUser;
		return currentUser.userID;
	}
});