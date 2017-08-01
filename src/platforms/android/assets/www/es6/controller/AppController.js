angular.module('starter.controllers', ['ionic'])
.controller('AppController', function($scope, $ionicModal, AuthenticationService, $state, $rootScope, LoginService, ApiService, $localstorage) {

  /*
    codeState:
      - getCodeSMS - user must enter phone number
      - getCodeEmail - user must enter email address
      - enterCode - message has been sent, waiting for user to enter code

    buttonState:
      - loading - something is happening!
      - userInput - waiting for userInput
  */

	//Init
	//Check to see if user is logged in.
  $scope.buttonState = 'userInput';
  $scope.lastCodeState = '';
	var currentUser = $rootScope.globals.currentUser;
  if (!currentUser) {
    $scope.isLoggedIn = false;
  } else {
    //We have a token, but we don't know that its valid
    ApiService.isLoggedIn()
      .then(() => $scope.isLoggedIn = true)
      .catch(err => {
        console.log("User is no longer logged in", err);
        $scope.isLoggedIn = false;
        //logout, but still hold onto the credentials just in case
        $scope.logout();
      });
  }

	$scope.login = function() {
    //Try to login with last saved token first:
    const _scope = $scope;
    return AuthenticationService.tryLastTokenLogin()
      .then(() => {
        $rootScope.$broadcast('login-state-changed', { any: {} });
      })
      .catch(err => {

        $scope.email = $localstorage.get('last_entered_email', '');
        $scope.mobile_number = $localstorage.get('last_entered_mobile_number', '');
        $scope.tel = $localstorage.get('last_entered_mobile_number', '');

        //Gets executed in child state
        $scope.modal.show();
        // this.$parent.modal.show();
        $scope.codeState = 'getCodeEmail';
      });
	}

	$scope.logout = function(shouldClear) {
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

  $scope.shouldDisableEmailButton = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return !re.test(email);
  }

  $scope.switchService = function() {
    console.log($scope.codeState);
    if ($scope.codeState === "getCodeSMS") {
      $scope.codeState = "getCodeEmail";
      return;
    }

    $scope.codeState = "getCodeSMS";
  }

  //Send the request to make the 1 time code
  $scope.getCodeSMS = function(mobile_number) {
    $localstorage.set('last_entered_mobile_number', mobile_number);
    $scope.lastCodeState = 'getCodeSMS';
    $scope.email = '';

    //get rid of first '+'
    $scope.mobile_number = mobile_number.replace("+", "");
    //TODO: send message
    $scope.buttonState = 'loading';
    return ApiService.sendLoginCodeSMS(mobile_number)
      .then(() => {
        $scope.buttonState = 'userInput';
        $scope.codeState = 'enterCode';
      })
      .catch(err => {
        console.log("Err", err);
        $scope.buttonState = 'userInput';
        $scope.codeState = $scope.lastCodeState;
        window.alert('Error sending login code. Please try again.');
      })
  }

  $scope.getCodeEmail = function(email) {
    $localstorage.set('last_entered_email', email);
    $scope.mobile_number = '';
    $scope.lastCodeState = 'getCodeEmail';

    $scope.buttonState = 'loading';

    return ApiService.sendLoginCodeEmail(email)
      .then(() => {
        $scope.buttonState = 'userInput';
        $scope.codeState = 'enterCode';
      })
      .catch(err => {
        console.log("Err", err);
        $scope.buttonState = 'userInput';
        $scope.codeState = $scope.lastCodeState;
        window.alert('Error sending login code. Please try again.');
      });
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
  $scope.performLogin = function(mobile_number, email, code) {

    if ($scope.lastCodeState === 'getCodeEmail') {
      mobile_number = null;
    } else {
      email = null;
    }

    console.log("Performing login", mobile_number, email, code);
    return ApiService.loginWithCode(mobile_number, email, code)
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
    $scope.codeState = 'getCodeSMS';
    $scope.buttonState = 'userInput';
    $scope.mobile_number = null;

  }

  //TODO: remember number (using local storage)

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
