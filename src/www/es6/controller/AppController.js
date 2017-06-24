angular.module('starter.controllers', ['ionic'])
.controller('AppController', function($scope, $ionicModal, AuthenticationService, $state, $rootScope, LoginService, ApiService) {

  /*
    codeState:
      - getCode - user must enter phone number
      - enterCode - message has been sent, waiting for user to enter code

    buttonState:
      - loading - something is happening!
      - userInput - waiting for userInput
  */

	//Init
	//Check to see if user is logged in.
  $scope.buttonState = 'userInput';
	var currentUser = $rootScope.globals.currentUser;
	if(currentUser) {
		$scope.isLoggedIn = true;
	}
	else {
		$scope.isLoggedIn = false;
	}

	$scope.login = function() {
		$scope.modal.show();
    $scope.codeState = 'getCode';

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

  $scope.shouldDisablePhoneButton = function(tel) {
    if (!tel) {
      return true;
    }

    if (!tel.$modelValue || tel.$modelValue.length == 0) {
      return true;
    }

    if (tel.$isInvalid) {
      return true;
    }

    return false;
  }

  //Send the request to make the 1 time code
  $scope.getCode = function(mobile_number) {
    //get rid of first '+'
    $scope.mobile_number = mobile_number.replace("+", "");
    console.log("Getting code", $scope.mobile_number);
    //TODO: send message
    $scope.buttonState = 'loading';
    return ApiService.sendLoginCode(mobile_number)
      .then(() => {
        $scope.buttonState = 'userInput';
        $scope.codeState = 'enterCode';
      })
      .catch(err => {
        console.log("Err", err);
        $scope.buttonState = 'userInput';
        $scope.codeState = 'getCode'; //only change once loaded
        window.alert('Error sending login code. Please try again.');
      })
  }

  $scope.isCodeValid = function(code) {
    let valid = true;

    if (!code) {
      valid = false;
      return valid;
    }

    if (code.length !== 6) {
      valid = false
    }
    return valid;
  }

  //Perform the login
  $scope.performLogin = function(code) {
    console.log("Performing login", code);

    return ApiService.loginWithCode($scope.mobile_number, code)
      .then(response => {
        console.log(response);
        if (response.status === 200) {
          //login
          const user = {
            id: response.data.userId,
            authToken:response.data.id,
            username: 'marvi',
            verified: true,
            service: 'none'
          };
          AuthenticationService.SetCredentials(user, response.data.id);
          $scope.modal.hide();
        } else {
          window.alert('Login Error: '+ response.status);
        }
      })
      .catch(function (err){
        console.log("err", err);
        window.alert('Login Error: '+ err.status);
      });
  }

  $scope.resetLogin = function() {
    $scope.codeState = 'getCode';
    $scope.buttonState = 'userInput';
    $scope.mobile_number = null;

  }

  //TODO: remember number (using local storage)
  //TODO: Figure out country code
  //TODO: "didn't get message" button



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
