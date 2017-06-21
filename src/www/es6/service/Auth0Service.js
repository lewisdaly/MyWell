'use strict';

angular.module('service.auth0', [])
.service('Auth0Service', function(angularAuth0) {

  function login() {
    angularAuth0.authorize();
  }

  return {
    login: login
  }
});
