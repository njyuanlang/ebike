// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('ebike', ['ionic', 'ngCordova', 'pascalprecht.translate', 'ngIOS9UIWebViewPatch','ebike.controllers', 'ebike.services', 'ebike.filters', 'ebike.directives'])

.constant('defaultLanguage', 'zh')
.config(function($stateProvider, $urlRouterProvider, $translateProvider, defaultLanguage) {
  $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
  $translateProvider.useStaticFilesLoader({
    'prefix': 'i18n/',
    'suffix': '.json'
  });
  $translateProvider.preferredLanguage(defaultLanguage);
  $translateProvider.fallbackLanguage(defaultLanguage);
})

.run(function($ionicPlatform, $state, $rootScope, $cordovaSplashscreen,
  $cordovaStatusbar, $ionicHistory, $cordovaNetwork, User, RemoteStorage, $http,
  $ionicPopup, MyPreferences, BLEDevice, $ionicLoading, $cordovaGlobalization,
  $translate, AnonymousUser) {

  function setLanguage() {
    if(typeof navigator.globalization !== "undefined") {
      $cordovaGlobalization.getPreferredLanguage().then(function(language) {
        $rootScope.language = language.value.split('-')[0];
        $translate.use($rootScope.language);
      });
    } else {
      // For Debug on browser
      $translate.use('en');
    }
  }
  $ionicPlatform.ready(function() {

    setLanguage();

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      if(ionic.Platform.isIOS()) {
        cordova.plugins.Keyboard.disableScroll(true);
      }
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    if(window.cordova) {
      cordova.getAppVersion.getVersionNumber(function(version) {
        $rootScope.appVersion = version;
      });
      cordova.getAppVersion.getVersionCode(function (build) {
        $rootScope.appBuild = build;
      });
    } else {
      $rootScope.appVersion = '4.0.0';
      $rootScope.appBuild = '1000';
    }

    if(screen.lockOrientation) {
      window.addEventListener("orientationchange", function() {
        if(Math.abs(window.orientation) === 90) {
          $cordovaStatusbar.hide()
          $state.go('cruise')
        } else {
          $cordovaStatusbar.show()
          $state.go('tab.home')
        }
      }, false);

      // screen.lockOrientation('portrait-primary')
      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if(toState.name === 'tab.home') {
          window.plugins.insomnia.allowSleepAgain()
          screen.unlockOrientation()
        } else if(toState.name === 'cruise') {
          window.plugins.insomnia.keepAwake()
          screen.unlockOrientation()
          // screen.lockOrientation('landscape-primary')
        } else {
          screen.lockOrientation('portrait-primary')
        }
      })
    }

    if(navigator.splashscreen) {
      setTimeout(function() {
        navigator.splashscreen.hide()
      }, 300);
    }

    if(window.ble) {
      ble.isEnabled(function (result) {
        ble.scan([], 5, function () {}, function () {})
      }, function (error) {
        $rootScope.$broadcast('bluetooth.disabled');
      })
    }

    if(User.isAuthenticated()) {
      //For Debug on browser
      // $rootScope.online = false;
      $rootScope.$broadcast('user.DidLogin');
    } else {
      AnonymousUser.login();
    }
  });

  $rootScope.hideTabs = false;
  $rootScope.online = true
  $rootScope.avatar = null;
  $rootScope.buttonVibrate = true;

  $rootScope.$on('user.DidLogin', function (event, args) {
    var userId = User.getCurrentId();
    MyPreferences.load(userId)
    .finally(function () {
      $rootScope.currentUser = User.getCurrent();
    });
    if(!$rootScope.avatar) {
      $rootScope.avatar = 'img/user-icon.png';
      RemoteStorage.getAvatar(userId)
        .success(function (buffer) {
          $rootScope.avatar = buffer
        })
        .error(function () {
          console.log(JSON.stringify(arguments));
        })
    }
  })

  $rootScope.$on('user.DidLogout', function (event, args) {
    AnonymousUser.login();
  })

  $rootScope.$watch('currentBike', function (newValue, oldValue) {
    if((!$rootScope.online || (newValue&&newValue.id&&newValue.localId))
    && (!oldValue || newValue.localId!==oldValue.localId)) {
      if(!$rootScope.device || $rootScope.device.localId != newValue.localId) {
        $rootScope.device = new BLEDevice(newValue);
        $rootScope.device.autoconnect();
      }
    }
  })

  $rootScope.$watch('currentBike.safe', function (newValue, oldValue) {
    if(newValue !== oldValue) {
      if($rootScope.correctSafeMode) {
        $rootScope.correctSafeMode = false;
        return;
      }

      $rootScope.device.safeMode(newValue)
      .then(function (result) {
        console.log('Success Set SafeMode:'+newValue);
      }, function (reason) {
        $rootScope.correctSafeMode = true;
        $rootScope.currentBike.safe = oldValue;
        $ionicLoading.show({
          template: '<i class="icon ion-ios-information-outline padding"></i>'+reason,
          duration: 2000
        });
      });
    }
  });

  $rootScope.isAndroid = ionic.Platform.isAndroid()

  $ionicPlatform.on('pause', function () {
    if($rootScope.device) {
      $rootScope.device.disconnect();
    }
  })

  $ionicPlatform.on('resume', function () {
    if($rootScope.device) {
      $rootScope.device.autoconnect();
    }
  })

  moment.locale('zh-CN');

})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

    // entry
    .state('entry', {
      url: "/entry",
      templateUrl: "templates/entry.html",
      controller: 'EntryCtrl'
    })

    // login
    .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'LoginCtrl'
    })

    // register
    .state('register', {
      url: "/register?reset",
      templateUrl: "templates/register.html",
      controller: 'RegisterCtrl'
    })
    .state('provinces', {
      url: "/provinces",
      templateUrl: "templates/provinces.html",
      controller: 'ProvincesCtrl'
    })
    .state('cities', {
      url: "/cities?province",
      templateUrl: "templates/cities.html",
      controller: 'CitiesCtrl'
    })
    .state('account', {
      url: "/account",
      templateUrl: "templates/account.html",
      controller: 'AccountCtrl'
    })

    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

    // home
    .state('tab.home', {
      url: "/home",
      views: {
        'tab-home': {
          templateUrl: "templates/tab-home.html",
          controller: 'HomeCtrl'
        }
      }
    })

    // test
    .state('tab.test', {
      url: "/test",
      views: {
        'tab-home': {
          templateUrl: "templates/test.html",
          controller: 'TestCtrl'
        }
      }
    })
    .state('tab.home-bind', {
      url: "/bikes/bind",
      views: {
        'tab-home': {
          templateUrl: "templates/bikes-add.html",
          controller: 'BikesAddCtrl'
        }
      }
    })
    // cruise
    .state('cruise', {
      url: "/cruise",
      templateUrl: "templates/cruise.html",
      controller: 'CruiseCtrl'
    })

    // merchants
    .state('tab.merchants', {
      url: "/merchants",
      views: {
        'tab-merchants': {
          templateUrl: "templates/tab-merchants.html",
          controller: 'MerchantsCtrl'
        }
      }
    })
    .state('tab.merchant-add', {
      url: '/merchants/add?position',
      views: {
        'tab-merchants': {
          templateUrl: "templates/merchant-add.html",
          controller: 'MerchantAddCtrl'
        }
      }
    })
    .state('tab.merchant-mark', {
      url: '/merchants/mark',
      views: {
        'tab-merchants': {
          templateUrl: "templates/merchant-mark.html",
          controller: 'MerchantMarkCtrl'
        }
      }
    })

    // chats
    .state('tab.chats', {
      url: "/chats",
      views: {
        'tab-chats': {
          templateUrl: "templates/tab-chats.html",
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat', {
      url: "/chats/detail",
      views: {
        'tab-chats': {
          templateUrl: "templates/chat.html",
          controller: 'ChatCtrl'
        }
      }
    })

    // menu
    .state('tab.menu', {
      url: "/menu",
      views: {
        'tab-menu': {
          templateUrl: "templates/tab-menu.html",
          controller: 'MenuCtrl'
        }
      }
    })

    // account
    .state('tab.account', {
      url: "/account",
      views: {
        'tab-menu': {
          templateUrl: "templates/account.html",
          controller: 'AccountCtrl'
        }
      }
    })

    .state('tab.bike', {
      url: "/bikes/:bikeId",
      views: {
        'tab-menu': {
          templateUrl: "templates/bike.html",
          controller: 'BikeCtrl'
        }
      }
    })
    .state('brands', {
      url: "bikes/:id/brands",
      templateUrl: "templates/brands.html",
      controller: 'BrandsCtrl'
    })
    .state('models', {
      url: "bikes/:id/models?brandId",
      templateUrl: "templates/models.html",
      controller: 'ModelsCtrl'
    })
    .state('bike-register', {
      url: "/bikes/:bikeId",
      templateUrl: "templates/bike-register.html",
      controller: 'BikeCtrl'
    })
    .state('register-wheeldiameter', {
      url: "register/wheeldiameters",
      templateUrl: "templates/wheeldiameters.html",
      controller: 'WheelDiametersCtrl'
    })
    .state('register-voltage', {
      url: "register/voltage",
      templateUrl: "templates/voltages.html",
      controller: 'VoltagesCtrl'
    })
    .state('register-current', {
      url: "register/current",
      templateUrl: "templates/currents.html",
      controller: 'CurrentsCtrl'
    })
    .state('tab.wheeldiameters', {
      url: "bikes/:id/wheeldiameters",
      views: {
        'tab-menu': {
          templateUrl: "templates/wheeldiameters.html",
          controller: 'WheelDiametersCtrl'
        }
      }
    })
    .state('tab.voltages', {
      url: "bikes/:id/voltages",
      views: {
        'tab-menu': {
          templateUrl: "templates/voltages.html",
          controller: 'VoltagesCtrl'
        }
      }
    })
    .state('tab.currents', {
      url: "bikes/:id/currents",
      views: {
        'tab-menu': {
          templateUrl: "templates/currents.html",
          controller: 'CurrentsCtrl'
        }
      }
    })
    .state('tab.bikes-add', {
      url: "/bikes/add",
      views: {
        'tab-menu': {
          templateUrl: "templates/bikes-add.html",
          controller: 'BikesAddCtrl'
        }
      }
    })
    // messages
    .state('tab.messages', {
      url: "/messages",
      views: {
        'tab-menu': {
          templateUrl: "templates/messages.html",
          controller: 'MessagesCtrl'
        }
      }
    })
    .state('tab.messages-detail', {
      url: "/messages/:type",
      views: {
        'tab-menu': {
          templateUrl: "templates/messages-detail.html",
          controller: 'MessagesDetailCtrl'
        }
      }
    })
    // services
    .state('tab.services', {
      url: "/services",
      views: {
        'tab-menu': {
          templateUrl: "templates/services.html"
        }
      }
    })
    // about
    .state('tab.about', {
      url: "/about",
      views: {
        'tab-menu': {
          templateUrl: "templates/about.html"
        }
      }
    })
    // intro
    .state('intro', {
      url: "/intro",
      templateUrl: "templates/help.html"
    })
    // setting
    .state('tab.setting', {
      url: "/setting",
      views: {
        'tab-menu': {
          templateUrl: "templates/setting.html"
        }
      }
    })
    // custom key
    .state('tab.custom', {
      url: "/custom",
      views : {
        'tab-menu': {
          templateUrl: "templates/custom.html"
        }
      }
    })


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/home');

})

.config(function ($ionicConfigProvider) {
  $ionicConfigProvider.views.swipeBackEnabled(false);
  $ionicConfigProvider.tabs.style('standard');
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center');
})

.config(function ($httpProvider) {
  $httpProvider.interceptors.push(function($q, $location, LoopBackAuth, $rootScope) {
    return {
      responseError: function(rejection) {
        if (rejection.status == 401) {
          LoopBackAuth.clearUser();
          LoopBackAuth.clearStorage();
          $rootScope.$broadcast('user.DidLogout')
          // AnonymousUser.login();
          $location.path('/tab/home')
        }
        return $q.reject(rejection);
      }
    };
  });
})


var controllers = angular.module('ebike.controllers', [])
