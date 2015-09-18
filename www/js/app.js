// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('ebike', ['ionic', 'ngCordova', 'ngIOS9UIWebViewPatch','ebike.controllers', 'ebike.services', 'ebike.filters', 'ebike.directives'])

.run(function($ionicPlatform, $state, $rootScope, $cordovaSplashscreen, $cordovaStatusbar, $ionicHistory, $cordovaNetwork, ActiveBLEDevice, User, $localstorage, RemoteStorage, $http, $ionicPopup) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    if(window.cordova) {
      cordova.getAppVersion(function(version) {
        $rootScope.appVersion = version;
      });
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
        if(toState.name === 'home') {
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
    
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      if(toState.name === 'home') {
        if(fromState.name === 'login' 
        || fromState.name === 'cities') {
          $rootScope.$broadcast('home.reconnect')
        }
        $ionicHistory.clearHistory()
      }
      
    })

    if(window.ble) {
      ble.isEnabled(function (result) {
        ble.scan([], 10, function () {}, function () {})
      }, function (error) {
        $ionicPopup.alert({
          title: '打开蓝牙来允许“帮大师”连接到车辆',
          okText: '好'
        });
      })
    }
    
    $rootScope.$on('go.home', function (event, args) {
      if(args && args.bike) {
        ActiveBLEDevice.setBike(args.bike)
        // $ionicHistory.nextViewOptions({
        //   historyRoot: true,
        //   disableBack: true
        // })
      }
      $state.go('tab.home')
    })
    
    if(User.isAuthenticated()) {
      $rootScope.$broadcast('user.DidLogin', {userId: User.getCurrentId()})
      setTimeout(function () {
        ActiveBLEDevice.get().autoconnect()
      }, 1000)
    }
  });  
  
  $rootScope.hideTabs = false;
  $rootScope.online = true
  $rootScope.avatar = null
  
  $rootScope.$on('user.DidLogin', function (event, args) {
    $rootScope.currentUser = User.getCurrent();
    var userId = args.userId
    if(!$rootScope.avatar) {
      var url = RemoteStorage.getDownloadURL('uploads', userId, 'avatar.png')
      $http.get(url)
      .success(function (buffer) {
        $rootScope.avatar = buffer
      })
      .error(function () {
        console.debug(JSON.stringify(arguments))
      })
    }
  })
  
  $rootScope.isAndroid = ionic.Platform.isAndroid()
  $rootScope.appVersion = '1.3.0'
  
  $ionicPlatform.on('pause', function () {
    ActiveBLEDevice.get().disconnect()
  })
  
  $ionicPlatform.on('resume', function () {
    ActiveBLEDevice.get().autoconnect()
  })
  
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
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

    // cruise 
    .state('cruise', {
      url: "/cruise",
      templateUrl: "templates/cruise.html",
      controller: 'CruiseCtrl'
    })
    
    // discover
    .state('tab.discover', {
      url: "/discover",
      views: {
        'tab-discover': {
          templateUrl: "templates/tab-discover.html"
          // controller: 'DiscoverCtrl'
        }
      }
    })

    // chats
    .state('tab.chats', {
      url: "/chats",
      views: {
        'tab-chats': {
          templateUrl: "templates/tab-chats.html"
          // controller: 'ChatsCtrl'
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
    // bikes 
    // .state('bikes', {
    //   url: "/bikes",
    //   templateUrl: "templates/bikes.html",
    //   controller: 'BikesCtrl'
    // })
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
    .state('bikes-add', {
      url: "/bikes/add",
      templateUrl: "templates/bikes-add.html",
      controller: 'BikesAddCtrl'
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
    // help
    .state('help', {
      url: "/help",
      templateUrl: "templates/help.html"
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
    

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/home');

})

var controllers = angular.module('ebike.controllers', [])
