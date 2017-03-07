angular.module('service.signup',[])
//Influenced by: http://www.bennadel.com/blog/2612-using-the-http-service-in-angularjs-to-make-ajax-requests.htm
.service("SignupService", function($http, $q, apiUrl) {

  //Return public api
  return({
    signUp: signUp //Sign up with a user object
  });

  //Public Methods

  function signUp(user) {
    var baseUrl = apiUrl;
    var method = 'post';

    if (constants.offline) {
      method = "get"; //We need to send get request in offline mode
    }

    //TODO: We need to hash out the password
    return $http({
      method: method,
      headers: {'Content-Type': 'application/json'},
      url: baseUrl + "/signup", //TODO: make 
      data: user
    }).success(function(data) {
      console.log("Success");
    })
    .error (function() {
      console.log("Error");
    });
  }
});