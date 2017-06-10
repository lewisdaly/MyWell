"use strict";
angular.module('rainapp.utils', [])

//localStorage utility
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      try {
        let parsedJson = JSON.parse($window.localStorage[key]);
        return parsedJson;
      } catch (err) {
        return null;
      }
    },
    delete: function(key) {
    	$window.localStorage.removeItem(key);
    }
  }
}])

.constant('AzureMobileServiceClient', {
    API_URL : "https://watermanagementmobile.azure-mobile.net/",
    API_KEY : "vQWzbtVFXjBmcfKYtVmYPVkCzjynlo72"
  })

.service('CachingService', function($localstorage) {
  return ({
    getReportCache: getReportCache,
    getReportAtIndex: getReportAtIndex,
    deleteReportAtIndex:deleteReportAtIndex,
    addReportToCache:addReportToCache,
    addResourceToCache: addResourceToCache,
    getResourceFromCache: getResourceFromCache,
    saveFavouriteLocation: saveFavouriteLocation,
    getFavouriteLocation: getFavouriteLocation
  });

  //get the cached reports from local storage.
  //Create if it doesn't exist
  function getReportCache() {
    return findOrCreateReportCache();
  }

  function getReportAtIndex(index) {
    let reportCache = getReportCache();
    return reportCache[index];
  }

  /**
   * Delete a report at given index and update local storage
   */
  function deleteReportAtIndex(index) {
    let reportCache = findOrCreateReportCache();
    reportCache.splice(index, 1);

    return saveReportCache(reportCache);
  }

  /**
   * add a report and save to local storage
   */
  function addReportToCache(report) {
    let reportCache = findOrCreateReportCache();
    //TODO: validate report here?
    reportCache.push(report);

    return saveReportCache(reportCache);
  }

  /* Private functions */

  function findOrCreateReportCache() {
    let reportCache = $localstorage.getObject('reportCache');
    if (!angular.isNullOrUndefined(reportCache)) {
      return reportCache;
    }

    //Cache doesn't exist. Create it here
    reportCache = [];
    return saveReportCache(reportCache);
  }

  function saveReportCache(reportCache) {
    $localstorage.setObject('reportCache', reportCache);
    return reportCache;
  }

  function addResourceToCache(data) {
    $localstorage.setObject('resourceCache', data);
  }

  function getResourceFromCache() {
    let resourceCache = $localstorage.getObject('resourceCache');
    if (angular.isNullOrUndefined(resourceCache)) {
      return {};
    }

    return resourceCache;
  }

  function saveFavouriteLocation(lat, lng) {
    console.log("Saving favourite location:", lat, lng);
    const locationArray = [lat, lng];
    $localstorage.setObject('favouriteLocation', locationArray);
  }

  function getFavouriteLocation() {
    const location = $localstorage.getObject('favouriteLocation');
    console.log("Getting favouriteLocation:", location);
    return location;
  }
});
