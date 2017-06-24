angular.module('starter.controllers', ['ionic'])
.controller('AppController', function($scope, $ionicModal, lockPasswordless, AuthenticationService, $state, $rootScope, LoginService, ApiService) {

  const callbackURI = "onLoginSuccess"

	//Init
	//Check to see if user is logged in.
	var currentUser = $rootScope.globals.currentUser;
	if(currentUser) {
		$scope.isLoggedIn = true;
	}
	else {
		$scope.isLoggedIn = false;
	}

  $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
    console.log(oldUrl, "to", newUrl);
    console.log("window.location", window.location);
    // var hash = lockPasswordless.parseHash(window.location.hash);

    // lockPasswordless.getProfile("38lVA-7_OB-88IKn", function (err, profile) {
    //   if (err){
    //     //handle err
    //     console.log("err", err);
    //   } else {
    //     //use user profile
    //     console.log("HEY", profile);
    //   }
    // });
  });

	$scope.login = function() {
    console.log(window.location);
    const options = {
      auth: {
        redirectUrl: `${window.location.href}`,
      },
      "focusInput":false,
      title: "MyWell Login"
    };
    // lockPasswordless.sms(options);
    lockPasswordless.emailcode(options);
	}

	$scope.logout = function() {
    //TODO: log out with Auth0

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

  $scope.performLogin = function(form) {
    // Auth0Service.login();
  }

	// $scope.performLogin = function(form) {
  //   if (angular.isNullOrUndefined(form) || angular.isNullOrUndefined(form.password) || form.password.length === 0){
  //     return;
  //   }
  //
  //   ApiService.login('marvi', form.password)
  //   .then(function (response) {
  //     console.log(response);
  //     if (response.status === 200) {
  //       //login
  //       const user = {
  //         id: response.data.userId,
  //         authToken:response.data.id,
  //         username: 'marvi',
  //         verified: true,
  //         service: 'none'
  //       };
  //       AuthenticationService.SetCredentials(user, response.data.id);
  //       $scope.modal.hide();
  //     } else {
  //       window.alert('Login Error: '+ response.status);
  //     }
  //   })
  //   .catch(function (err){
  //     console.log("err", err);
  //     window.alert('Login Error: '+ err.status);
  //
  //   });
	// }

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
