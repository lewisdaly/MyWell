'use strict';

angular.module('service.api', [])
.service('ApiService', function($http, $q, $rootScope, apiUrl, AuthenticationService, $localstorage, CachingService) {

  return({
    getResources:getResources,
    getVillages:getVillages,
    getClosestVillage:getClosestVillage,
    registerWell:registerWell,
    updateReading:updateReading,
    login:login,
    getStatisticsForResource: getStatisticsForResource,
    processExcelFile: processExcelFile,
    getDifferenceFromJune: getDifferenceFromJune,
    getResourceReadings: getResourceReadings,
    getResource: getResource,
    uploadImageForResource: uploadImageForResource,
    getReadingsByWeek: getReadingsByWeek,
    getCurrentVillageAverage: getCurrentVillageAverage
  });


  function uploadImageForResource(postcode, resourceId, data) {
    return $http({
      method:'put',
      headers: {'Content-Type':'application/json'},
      url: `${apiUrl}/api/resources/${resourceId}?access_token=${AuthenticationService.getAccessToken()}`,
      data: {
        image: data,
        postcode: postcode
      }
    });
  }

  function getResource(postcode, resourceId) {
    return $http({
      method:'get',
      headers: {'Content-Type':'application/json'},
      url: `${apiUrl}/api/resources/${resourceId}&postcode=${postcode}`,
    });
  }

  function getReadingsByWeek(postcode, resourceId) {
    return $http({
      method: 'get',
      headers: {'Content-Type':'application/json'},
      url: `${apiUrl}/api/readings/readingsByWeek?postcode=${postcode}&resourceId=${resourceId}`
    });
  }

  function getResourceReadings(postcode, resourceId) {
    //TODO: optimize this later on to only get the past year...
    const requestUrl = `/api/readings?filter=%7B%22where%22%3A%7B%22and%22%3A%5B%7B%22postcode%22%3A${postcode}%7D%2C%7B%22resourceId%22%3A${resourceId}%7D%5D%7D%2C%20%22order%22%3A%20%22date%20ASC%22%7D&access_token=${AuthenticationService.getAccessToken()}`

    return $http({
      method: 'get',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + requestUrl
    });
  }

  /**
   * Get all the villages, with their
   */
  function getDifferenceFromJune(resourceType, readingType, resourceId, postcode) {
    let requestUrl = `/api/resource_stats/getDifferenceFromJune?readingType=${readingType}&resourceId=${resourceId}&postcode=${postcode}`
    if (!angular.isNullOrUndefined(resourceType)) {
      requestUrl = requestUrl + `&resourceType={$resourceType}`
    }

    return $http({
      method:'get',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + requestUrl
    });
  }

  function getVillages() {
    return Promise.resolve(true)
    .then(() => showLoadingIndicator())
    .then(() => {
      return $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: apiUrl + '/api/villages'
      });
    })
    .then(response => {
      hideLoadingIndicator()
      return response.data;
    })
    .catch(err => {
      hideLoadingIndicator()
      return Promise.reject(err)
    })
  }

  //Load all of the things
  //fallback to cache if fails
  function getResources() {
    return $http({
      method:'get',
      headers: {'Content-Type':'application/json'},
      url: apiUrl + '/api/resources?filter=%7B%22fields%22%3A%7B%22image%22%3Afalse%7D%7D'
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


  function getCurrentVillageAverage(postcode, resourceId) {
    const villageId = resourceId.substring(0,2);

    return $http({
      method:'get',
      headers: {'Content-Type':'application/json'},
      url: `${apiUrl}/api/resource_stats/getCurrentVillageAverage?villageId=${villageId}&postcode=${postcode}`,
    }).catch(err => {
      if (err.status !== 404) return Promise.reject(err);
      console.log("No current village reading");
    });
  }


  /**
   * Get the info and statistics for a resource
   * @returns Promise<[resource, villageAverage, historicalResourceAverages, historicalVillageAverages ]
   */
  function getStatisticsForResource(postcode, resourceId) {
    //Get all of the needed statistics:
    const villageId = resourceId.substring(0,2);

    const skip404Error = (err) => {
      console.log("err", err);
      if (err.status !== 404) return Promise.reject(err);
    }

    return Promise.all([
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resources/${resourceId}&postcode=${postcode}`,
      }).catch(err => skip404Error(err)),
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resource_stats/getCurrentVillageAverage?villageId=${villageId}&postcode=${postcode}`,
      }).catch(err => skip404Error(err)),
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resource_stats/getHistoricalResourceAverages?resourceId=${resourceId}&postcode=${postcode}`,
      }).catch(err => skip404Error(err)),
      $http({
        method:'get',
        headers: {'Content-Type':'application/json'},
        url: `${apiUrl}/api/resource_stats/getHistoricalVillageAverages?villageId=${villageId}&postcode=${postcode}`,
      }).catch(err => skip404Error(err))
    ]);
  }

  function processExcelFile(fileResponse) {
    //TODO: make url parameters load properly
    //TODO: inject hide and show loading indicator into every request...
    return Promise.resolve(true)
      .then(() => showSlowLoadingIndicator())
      .then(() => $http({
                  method:'get',
                  headers: {'Content-Type':'application/json'},
                  url: `${apiUrl}/api/readings/processExcelFile?container=${fileResponse.container}&name=${fileResponse.name}&access_token=${AuthenticationService.getAccessToken()}`,
                  timeout: 1000 * 60 * 10,// * 60 * 6 //6 mins
                  headers: {
                    'timeout': 1000,
                    'Connection': 'Keep-Alive'
                  }
                }))
      .then(res => {
        hideLoadingIndicator();
        return res;
      })
      .catch((err) => {
        hideLoadingIndicator();
        return Promise.reject(err);
      })
  }

  function showLoadingIndicator() {
     $rootScope.$broadcast('loading:show');
  }

  function showSlowLoadingIndicator() {
     $rootScope.$broadcast('loading:show-slow');
  }


  function hideLoadingIndicator() {
     $rootScope.$broadcast('loading:hide');
  }

});
