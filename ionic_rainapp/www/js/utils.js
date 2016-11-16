"use strict";

angular.module('rainapp.utils', [])

//localStorage utility
.factory('$localstorage', ['$window', function ($window) {
  return {
    set: function set(key, value) {
      $window.localStorage[key] = value;
    },
    get: function get(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function setObject(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function getObject(key) {
      try {
        var parsedJson = JSON.parse($window.localStorage[key]);
        return parsedJson;
      } catch (err) {
        return null;
      }
    },
    delete: function _delete(key) {
      $window.localStorage.removeItem(key);
    }
  };
}]).constant('AzureMobileServiceClient', {
  API_URL: "https://watermanagementmobile.azure-mobile.net/",
  API_KEY: "vQWzbtVFXjBmcfKYtVmYPVkCzjynlo72"
}).service('CachingService', function ($localstorage) {
  return {
    getReportCache: getReportCache,
    getReportAtIndex: getReportAtIndex,
    deleteReportAtIndex: deleteReportAtIndex,
    addReportToCache: addReportToCache,
    addResourceToCache: addResourceToCache,
    getResourceFromCache: getResourceFromCache
  };

  //get the cached reports from local storage.
  //Create if it doesn't exist
  function getReportCache() {
    return findOrCreateReportCache();
  }

  function getReportAtIndex(index) {
    var reportCache = getReportCache();
    return reportCache[index];
  }

  /**
   * Delete a report at given index and update local storage
   */
  function deleteReportAtIndex(index) {
    var reportCache = findOrCreateReportCache();
    reportCache.splice(index, 1);

    return saveReportCache(reportCache);
  }

  /**
   * add a report and save to local storage
   */
  function addReportToCache(report) {
    var reportCache = findOrCreateReportCache();
    //TODO: validate report here?
    reportCache.push(report);

    return saveReportCache(reportCache);
  }

  /* Private functions */

  function findOrCreateReportCache() {
    var reportCache = $localstorage.getObject('reportCache');
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
    var resourceCache = $localstorage.getObject('resourceCache');
    if (angular.isNullOrUndefined(resourceCache)) {
      return {};
    }

    return resourceCache;
  }
});