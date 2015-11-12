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
      return JSON.parse($window.localStorage[key] || '{}');
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

;
