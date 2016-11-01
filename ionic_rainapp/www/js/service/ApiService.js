angular.module('service.api', [])
.service('ApiService', function($http, $q, $rootScope, apiUrl, AuthenticationService, $localstorage, CachingService) {

  return({
    getResources:getResources,
    getClosestVillage:getClosestVillage,
    registerWell:registerWell,
    updateReading:updateReading,
    login:login
  });

  //Load all of the things
  //fallback to cache if fails
  function getResources() {
    return $http({
      method:'get',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + '/api/resources?filter=%7B%22include%22%3A%22village%22%7D'
    })
    .then(function(response) {
      //cache the response
      $localstorage.setObject('getResourcesCache', response);
      return response;
    })
    .catch(function(err) {
      //Rollback to previous request if exists
      let cached = $localstorage.getObject('getResourcesCache');
      if (!angular.isNullOrUndefined(cached)) {
        return cached;
      }

      return Promise.reject(err);
    });
  }

  function getClosestVillage(villageId) {
    return $http({
      method:'get',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + '/api/villages/closestVillage?villageId=' + villageId
    });
  }

  /**
   * Update a resource reading
   * If we cannot connect, save to localstorage array
   */
  function updateReading(reading) {
    return $http({
      method:'post',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + '/api/readings?access_token=' + AuthenticationService.getAccessToken(),
      data:reading,
    });
  }

  function registerWell(resource) {
    return $http({
      method:'post',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + '/api/resources?access_token=' + AuthenticationService.getAccessToken(),
      data:resource
    });
  }

  //simple login
  // function login(password) {
  //   return $http({
  //     method:'get',
  //     headers: {'Content-Type':'application/json'},
  //     url: apiUrl + '/api/users/login?password=' + password
  //   });
  // }

  function login(username, password) {
    return $http({
      method:'post',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + '/api/Users/login',
      data: {username:username, password:password}
    });
  }

});
