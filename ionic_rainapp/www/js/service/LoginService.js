angular.module('service.login', [])

.service("LoginService",['$http', '$q', 'apiUrl', 'AuthenticationService', '$rootScope', function($http, $q, apiUrl, AuthenticationService, $rootScope) {
  //TODO: figure out how to save user's login credentials, and auto login

  //Return public api
  return({
    login: login,
    logout: logout,
    reAuthenticateUser: reAuthenticateUser
  });

  function reAuthenticateUser() {
    return $q(function(resolve, reject){
      //Get the current user
      var currentUser = $rootScope.globals.currentUser;
      if (!currentUser) {
        reject("User is not logged in");
      } else {
        //Perform the new login:
        login(currentUser.service, currentUser.authToken)
        .then(function(response) {
          resolve(response);
        }, function(error) {
          reject("Error");
        })
      }
    })
  }

  //Send empty token if login isn't resuming
  function login(service, token) {
    return $q(function(resolve, reject) {

      showLoadingIncicator();
      switch(service) {
        case 'facebook':
        Azureservice.login("facebook", token)
        .then(function(results) {
          var  currentUser = Azureservice.getCurrentUser();
          console.log("Current user: " + JSON.stringify(currentUser));

          Azureservice.invokeApi("authenticateuser", {
            body: {"service":"facebook", "user":Azureservice.getCurrentUser()},
            method: "post"})
          .then(function(response) {
            console.log("Azure success: " + JSON.stringify(response));

            // Store the authenticated user!
            AuthenticationService.SetCredentials(response, currentUser.mobileServiceAuthenticationToken);
            resolve("Success");
          },
          function(err) {
            console.error('Azure Error: ' + err);
            hideLoadingIndicator();
            reject("Error")
          });

        }, function(error){
          hideLoadingIndicator();
          alert(error);
          reject("Error")

        });

        break;
        case 'twitter':
        Azureservice.login("twitter", token)
        .then(function(results) {
          var  currentUser = Azureservice.getCurrentUser();
          console.log("Current user: " + JSON.stringify(currentUser));

          Azureservice.invokeApi("authenticateuser", {
            body: {"service":"twitter", "user":Azureservice.getCurrentUser()},
            method: "post"})
          .then(function(response) {
            console.log("Azure success: " + JSON.stringify(response));

            // Store the authenticated user!
            AuthenticationService.SetCredentials(response, currentUser.mobileServiceAuthenticationToken);
            resolve("Success");
          },
          function(err) {
            hideLoadingIndicator();
            console.error('Azure Error: ' + err);
            reject("Error")
          });

        }, function(error){
          hideLoadingIndicator();
          alert(error);
          reject("Error")

        });


        break;
        default:
          //Google
          Azureservice.login("google", token)
          .then(function(results) {
            var  currentUser = Azureservice.getCurrentUser();
            console.log("Current user: " + JSON.stringify(currentUser));

            Azureservice.invokeApi("authenticateuser", {
              body: {"service":"google", "user":Azureservice.getCurrentUser()},
              method: "post"})
            .then(function(response) {
              console.log("Azure success: " + JSON.stringify(response));

              // Store the authenticated user!
              AuthenticationService.SetCredentials(response, currentUser.mobileServiceAuthenticationToken);
              resolve("Success");
            },
            function(err) {
              hideLoadingIndicator();
              console.error('Azure Error: ' + err);
              reject("Error")
            });

          }, function(error){
            hideLoadingIndicator();
            alert(error);
            reject("Error")

          });
        }
      });
}

function logout() {
  var baseUrl = apiUrl;
  var request = $http({
    method: "post",
    url: baseUrl + "/logout"
  });
  return (request.then(handleSuccess, handleError));
}

  //Private Methods
  function handleError(response) {
    if(!angular.isObject(response.data) || !response.data.message) {
      return ($q.reject("An Unknown error occoured"));
    }

    //Otherwise, error message:
    return($q.reject(response.data.message));
  }

  function handleSuccess(response) {
    return(response.data);
  }

  function showLoadingIncicator() {
     $rootScope.$broadcast('loading:show');
  }

  function hideLoadingIndicator() {
     $rootScope.$broadcast('loading:hide');
  }
}]);
