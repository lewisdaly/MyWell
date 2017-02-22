// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', [
  'ionic',
  'ngMap',
  'ngFileUpload',
  'starter.controllers',
  'report.controllers',
  'controller.settings',
  'rainapp-constants',
  'ngIOS9UIWebViewPatch',
  'controller.signup',
  'controller.login',
  'controller.map',
  'controller.map-detail',
  'service.authentication',
  'service.login',
  'service.signup',
  'service.user',
  'service.api',
  'rainapp.utils',
  // 'azure-mobile-service.module',
  'AdalAngular'
  ])

.run(function($ionicPlatform, $rootScope, $ionicLoading, $location, $http, $localstorage) {
  $ionicPlatform.ready(() => {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    const codePushCallback = syncStatus => {
      switch (syncStatus) {
        case SyncStatus.APPLY_SUCCESS:
        case SyncStatus.UP_TO_DATE:
        case SyncStatus.UPDATE_IGNORED:
          break;
        case SyncStatus.ERROR:
          console.log("codesync error");
          break;
      }
    };

    const options = {
      installMode: InstallMode.ON_NEXT_RESTART, updateDialog: true
    };

    window.codePush.sync(codePushCallback, options);
  });
});

  //keep user logged in after page refresh
  //http://jasonwatmore.com/post/2015/03/10/AngularJS-User-Registration-and-Login-Example.aspx
  $rootScope.globals = $localstorage.getObject('globals');
  if ($rootScope.globals){
    // if ($rootScope.globals.currentUser) {
    //   $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
    // }
  } else {
    $rootScope.globals = {};
  }

  // $rootScope.$on('$locationChangeStart', function (event, next, current) {
  //   // redirect to login page if not logged in and trying to access a restricted page
  //   //TODO: Add to this!
  //   var pageArray = ['/login', '/signup'];
  //   var restrictedPage = pageArray.indexOf($location.path()) === -1;
  //   // var restrictedPage = $.inArray($location.path(), ) === -1;
  //   var loggedIn = $rootScope.globals.currentUser;
  //   if (restrictedPage && !loggedIn) {
  //     console.log("Error: not logged in. Redirecting to /login");
  //     $location.path('/login');
  //   }
  // });

  //Refer to: http://learn.ionicframework.com/formulas/loading-screen-with-interceptors/
  //Loading indicators and callbacks
  $rootScope.$on('loading:show', function() {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>'
    });
  })

  $rootScope.$on('loading:hide', function() {
    $ionicLoading.hide();
  })
})


//The ADAL Provider - Auth and Stuff
.config(['$compileProvider', '$stateProvider', '$urlRouterProvider', '$httpProvider', 'adalAuthenticationServiceProvider',
  function ($compileProvider, $stateProvider, $urlRouterProvider, $httpProvider, adalProvider) {
    adalProvider.init(
    {
      instance: 'https://login.microsoftonline.com/',
      tenant: '35a32751-a7a4-47e9-830e-d320e5e2ce25',//'contoso.onmicrosoft.com', //not sure if this is right...
      clientId: '18841449-2afd-4fdb-9246-0f7e461c61f8',
      extraQueryParameter: 'nux=1',
      //cacheLocation: 'localStorage', // enable this for IE, as sessionStorage does not work for localhost.
    },
    $httpProvider
    );


  }])

.config(function($stateProvider, $urlRouterProvider, $provide, debug, adalAuthenticationServiceProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginController'
  })

  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'SignupController'
  })


  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',

  })

  // Each tab has its own nav history stack:

  .state('tab.map', {
    url: '/map',
    // requireADLogin: true,
    views: {
      'tab-map': {
        templateUrl: 'templates/tab-map.html',
        //TODO: change this name
        controller: 'MapCtrl'
      }
    }
  })
  // Map detail page
  .state('tab.map-detail', {
    url: '/map/:postcode/:resourceId',
    views: {
      'tab-map': {
        templateUrl: 'templates/map-detail.html',
        controller: 'MapDetailController'
      }
    }
  })
  .state('tab.report', {
    url: '/report',
    // requireADLogin: true,
    views: {
      'tab-report': {
        templateUrl: 'templates/tab-report.html',
        controller: 'ReportController'
      }
    }
  })
  .state('tab.chat-detail', {
    url: '/chats/:chatId',
    // requireADLogin: true,
    views: {
      'tab-chats': {
        templateUrl: 'templates/chat-detail.html',
        controller: 'ChatDetailCtrl'
      }
    }
  })

  .state('tab.settings', {
    url: '/settings',
    // requireADLogin: true,
    views: {
      'tab-settings': {
        templateUrl: 'templates/tab-settings.html',
        controller: 'SettingsController'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/map');

  // catch exceptions in angular - http://forum.ionicframework.com/t/error-tracking-in-angular/8641
  $provide.decorator('$exceptionHandler', ['$delegate', function($delegate){
    return function(exception, cause){
      $delegate(exception, cause);

      var data = {
        type: 'angular',
        url: window.location.hash,
        localtime: Date.now()
      };
      if(cause)               { data.cause    = cause;              }
      if(exception){
        if(exception.message) { data.message  = exception.message;  }
        if(exception.name)    { data.name     = exception.name;     }
        if(exception.stack)   { data.stack    = exception.stack;    }
      }

      if(debug == 1){
        console.log('exception', data);
        window.alert('Error: '+data.message);
      } else {
        track('exception', data);
      }
    };
  }]);

  // catch exceptions out of angular
  window.onerror = function(message, url, line, col, error){
    var stopPropagation = debug ? false : true;
    var data = {
      type: 'javascript',
      url: window.location.hash,
      localtime: Date.now()
    };
    if(message)       { data.message      = message;      }
    if(url)           { data.fileName     = url;          }
    if(line)          { data.lineNumber   = line;         }
    if(col)           { data.columnNumber = col;          }
    if(error){
      if(error.name)  { data.name         = error.name;   }
      if(error.stack) { data.stack        = error.stack;  }
    }

    if(debug == 1){
      console.log('exception', data);
      window.alert('Error: '+data.message);
    } else {
      track('exception', data);
    }
    return stopPropagation;
  };

})


angular.isNullOrUndefined = function(val) {
  return angular.isUndefined(val) || val === null;
}
