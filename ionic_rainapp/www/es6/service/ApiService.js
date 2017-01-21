'use strict';

angular.module('service.api', [])
.service('ApiService', function($http, $q, $rootScope, apiUrl, AuthenticationService, $localstorage, CachingService) {

  return({
    getResources:getResources,
    getClosestVillage:getClosestVillage,
    registerWell:registerWell,
    updateReading:updateReading,
    login:login,
    getStatisticsForResourceId: getStatisticsForResourceId,
    processExcelFile: processExcelFile
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

  /**
   * Get the info and statistics for a resource
   * @returns Promise<[resource, villageAverage, historicalResourceAverages, historicalVillageAverages ]
   */
  function getStatisticsForResourceId(resourceId) {
    //Get all of the needed statistics:

    return Promise.all([
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resources/${resourceId}`,
      }),
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resource_stats/getCurrentVillageAverage?villageId=${resourceId[0]}`,
      }),
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resource_stats/getHistoricalResourceAverages?resourceId=${resourceId}`,
      }),
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resource_stats/getHistoricalVillageAverages?villageId=${resourceId[0]}`,
      })
    ]);
  }

  function processExcelFile(fileResponse) {
    //TODO: make url parameters load properly
    //TODO: inject hide and show loading indicator into every request...
    return Promise.resolve(true)
      .then(() => showLoadingIndicator())
      .then(() => $http({
                  method:'get',
                  headers: {'Content-Type':'application/json'},
                  url: `${apiUrl}/api/readings/processExcelFile?container=${fileResponse.container}&name=${fileResponse.name}&access_token=${AuthenticationService.getAccessToken()}`,
                }))
      .then(res => {
        hideLoadingIndicator();
        return res;
      })
      .catch((err) => {
        hideLoadingIndicator();
        throw err
      })
  }

  function showLoadingIndicator() {
     $rootScope.$broadcast('loading:show');
  }

  function hideLoadingIndicator() {
     $rootScope.$broadcast('loading:hide');
  }

});
