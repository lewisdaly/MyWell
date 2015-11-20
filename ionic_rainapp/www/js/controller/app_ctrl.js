angular.module('starter.controllers', ['ionic'])

.controller('AppCtrl', function($scope, $ionicModal, AuthenticationService, Azureservice, $state, $rootScope, LoginService) {

	//Init
	//Check to see if user is logged in.
	var currentUser = $rootScope.globals.currentUser;
	if(currentUser) {
		$scope.isLoggedIn = true;
	}
	else {
		$scope.isLoggedIn = false;
	}


	$scope.login = function() {
		$scope.modal.show();
	}

	$scope.logout = function() {
		AuthenticationService.ClearCredentials();
		$rootScope.$broadcast('login-state-changed');
		$scope.isVerified = false;
		$scope.unverifiedUsers = [];
	}

	$scope.cancel = function() {
		$scope.modal.hide();
	}

	$scope.$on('login-state-changed', function(e) {
		var currentUser = $rootScope.globals.currentUser;
		if(currentUser) {
			$scope.isLoggedIn = true;
		}
		else {
			$scope.isLoggedIn = false;
		}
	})


	//TODO: other services, google etc.
	//TODO: Auto login user!

	$scope.performLogin = function(service) {
		LoginService.login(service)
		.then(function(response) {
			$scope.modal.hide();

		},
		function(error) {
			$scope.modal.hide();
		});
	}

	$ionicModal.fromTemplateUrl('templates/login.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});


  	//Cleanup the modal when we're done with it!
  	$scope.$on('$destroy', function() {
  		$scope.modal.remove();
  	});
  	// Execute action on hide modal
  	$scope.$on('modal.hidden', function() {
    	// Execute action
    	$state.go($state.current, {}, {reload: true});
    	$rootScope.$broadcast('login-state-changed', { any: {} });

    });
  	// Execute action on remove modal
  	$scope.$on('modal.removed', function() {
   	 // Execute action
   	});

  })
;
