angular.module('service.login', [])

.service("LoginService",['$http', '$q', 'apiUrl', 'Azureservice', 'AuthenticationService', function($http, $q, apiUrl, Azureservice, AuthenticationService) {
  //TODO: figure out how to save user's login credentials, and auto login

  //Return public api
  return({
    login: login,
    logout: logout
  });

  //Public Methods
  // function login(user) {
  //   var url = apiUrl + '/api/user/current'; //TODO: change later on.
  //   var method = 'get';
  //   var objString = "username=" + user.username + "&password=" + user.password;

  //   var headers = user ? {authorization : "Basic "
  //       + btoa(user.username + ":" + user.password)
  //   } : {};

  //   return $http({
  //     method: method,
  //     headers: headers,
  //     url: url
  //   })
  //   .success(function(data, status, headers) {
  //     console.log("Login success: " + data);
  //     //Add the xsrf token manually here - don't think this works
  //     var token = headers('XSRF-TOKEN');
  //     $http.defaults.headers.post['X-XSRF-TOKEN'] = headers('XSRF-TOKEN');

  //   })
  //   .error(function(data) {


  //   }); 
  // }


  function login(service) {
    return $q(function(resolve, reject) {

      switch(service) {
        case 'facebook':
        Azureservice.login("facebook")
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
            reject("Error")
          });

        }, function(error){
          alert(error);
          reject("Error")

        });

        break;
        case 'twitter':
        Azureservice.login("twitter")
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
            console.error('Azure Error: ' + err);
            reject("Error")
          });

        }, function(error){
          alert(error);
          reject("Error")

        });


        break;
        default:
          //Google 
          Azureservice.login("google")
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
              console.error('Azure Error: ' + err);
              reject("Error")
            });

          }, function(error){
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
}]);



