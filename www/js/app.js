// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('ebike', ['ionic', 'ngCordova', 'ebike.controllers', 'ebike.services', 'ebike.filters'])

.run(function($ionicPlatform, $state, $rootScope, $cordovaSplashscreen, $cordovaStatusbar, $ionicHistory, $cordovaNetwork, ActiveBLEDevice, User, $localstorage, RemoteStorage, $http) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
 
    if(screen.lockOrientation) {
      window.addEventListener("orientationchange", function() {
        if(Math.abs(window.orientation) === 90) {
          $cordovaStatusbar.hide()
          $state.go('cruise')
        } else {
          $cordovaStatusbar.show()
          $state.go('home')
        }
      }, false);
  
      screen.lockOrientation('portrait-primary')
      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if(toState.name === 'home') {
          window.plugins.insomnia.allowSleepAgain()
          screen.unlockOrientation()
        } else if(toState.name === 'cruise') {
          window.plugins.insomnia.keepAwake()
          screen.unlockOrientation()   
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
      ble.scan([], 10, function () {
        
      })
    }
    
    $rootScope.$on('go.home', function (event, args) {
      if(args && args.bike) {
        ActiveBLEDevice.set(args.bike)
        $ionicHistory.nextViewOptions({
          historyRoot: true,
          disableBack: true
        })
      }
      $state.go('home')
    })
    
    if(User.isAuthenticated()) {
      $rootScope.$broadcast('user.DidLogin', {userId: User.getCurrentId()})
    }
    
  });  
  
  $rootScope.online = true
  $rootScope.avatar = null
  
  $rootScope.$on('user.DidLogin', function (event, args) {
    var userId = args.userId
    if(!$rootScope.avatar) {
      var url = RemoteStorage.getDownloadURL('uploads', userId, 'avatar.png')
      $http.get(url)
      .success(function (buffer) {
        $rootScope.avatar = buffer
      })
      .error(function () {
        console.log(JSON.stringify(arguments))
      })
    }
    // $rootScope.bike = $localstorage.get('$EBIKE$Bike$'+userId)
  })
    
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

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

    // home 
    .state('home', {
      url: "/home",
      templateUrl: "templates/home.html",
      controller: 'HomeCtrl'
    })

    // test 
    .state('test', {
      url: "/test",
      templateUrl: "templates/test.html",
      controller: 'TestCtrl'
    })

    // dashboard 
    .state('cruise', {
      url: "/cruise",
      templateUrl: "templates/cruise.html",
      controller: 'CruiseCtrl'
    })

    // menu 
    .state('menu', {
      url: "/menu",
      templateUrl: "templates/menu.html",
      controller: 'MenuCtrl'
    })
    // account 
    .state('account', {
      url: "/account",
      templateUrl: "templates/account.html",
      controller: 'AccountCtrl'
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
    // bikes 
    .state('bikes', {
      url: "/bikes",
      templateUrl: "templates/bikes.html",
      controller: 'BikesCtrl'
    })
    .state('bike', {
      url: "/bikes/:bikeId",
      templateUrl: "templates/bike.html",
      controller: 'BikeCtrl'
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
    .state('wheeldiameters', {
      url: "bikes/:id/wheeldiameters",
      templateUrl: "templates/wheeldiameters.html",
      controller: 'WheelDiametersCtrl'
    })
    .state('voltages', {
      url: "bikes/:id/voltages",
      templateUrl: "templates/voltages.html",
      controller: 'VoltagesCtrl'
    })
    .state('currents', {
      url: "bikes/:id/currents",
      templateUrl: "templates/currents.html",
      controller: 'CurrentsCtrl'
    })
    .state('bikes-add', {
      url: "/bikes/add",
      templateUrl: "templates/bikes-add.html",
      controller: 'BikesAddCtrl'
    })
    // messages
    .state('messages', {
      url: "/messages",
      templateUrl: "templates/messages.html",
      controller: 'MessagesCtrl'
    })
    .state('messages-detail', {
      url: "/messages/:type",
      templateUrl: "templates/messages-detail.html",
      controller: 'MessagesDetailCtrl'
    })
    // services
    .state('services', {
      url: "/services",
      templateUrl: "templates/services.html"
    })
    // help
    .state('help', {
      url: "/help",
      templateUrl: "templates/help.html"
    })
    // about
    .state('about', {
      url: "/about",
      templateUrl: "templates/about.html"
    })
    

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/home');

})

var controllers = angular.module('ebike.controllers', [])
