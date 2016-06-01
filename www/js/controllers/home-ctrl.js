controllers

.controller('HomeCtrl', function($scope, $state, $ionicLoading, User,
  $localstorage, $translate, $cordovaVibration) {

  var translations = {
    OPEN_WITH_KEY: '',
    REQUIRE_CONNECT_BIKE_TIPS: '',
    CONNECT_BIKE_FAILURE: ''
  };
  $translate(Object.keys(translations)).then(function (result) {
    translations = result;
  });

  $scope.$on( 'realtime.update', function (event) {
    if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
      $scope.device.setWorkmode(0)
    }
    $scope.$apply()
  })

  $scope.$on('$ionicView.enter', function (event) {
    $scope.showPrompt = false;
    if(!$scope.online) return $scope.device.onConnected();
    if(!$scope.device || $scope.device.status === 'disconnected') {
      var promptCount = $localstorage.get('$EBIKE$PromptCount', 0);
      if( promptCount < 5) {
        $scope.showPrompt = true;
        $localstorage.set('$EBIKE$PromptCount', ++promptCount);
      }
    }
  })

  $scope.goTest = function () {
    if($scope.device.status === 'connected') {
      if(!$scope.device.realtime.offline) {
        $state.go('tab.test')
      } else {
        $ionicLoading.show({
          template: '<i class="icon ion-ios-information-outline padding"></i>'+translations.OPEN_WITH_KEY,
          duration: 2000
        })
      }
    } else {
      $ionicLoading.show({
        template: '<i class="icon ion-ios-information-outline padding"></i>'+translations.REQUIRE_CONNECT_BIKE_TIPS,
        duration: 2000
      })
    }
  }

  $scope.endure = function () {
    $scope.device.setWorkmode(9)
  }

  var reconnectDevice = function () {
    $scope.showPrompt = false;
    if(!$scope.online) return $scope.device.onConnected()

    if($scope.currentBike && $scope.currentBike.id) {
      $scope.device.autoconnect().then(function (result) {

      }, function (reason) {
        if(reason === 'no localId') {
          $state.go('tab.home-bind')
        } else if(reason === 'connecting') {
          console.debug('prevent from contiuning autoconnect');
        } else {
          $ionicLoading.show({
            template: '<i class="icon ion-ios-close-outline padding"></i>'+translations.CONNECT_BIKE_FAILURE+reason,
            duration: 2000
          })
        }
      })
    } else {
      $state.go('brands', {id:'create'});
    }
  }

  $scope.reconnectDevice = reconnectDevice

  $scope.$on('home.reconnect', reconnectDevice);

  $scope.init = function () {
    if($localstorage.get('$EBIKE$IsNewbie', "YES") === "YES") {
      $localstorage.set('$EBIKE$IsNewbie', "NO")
      $state.go('intro')
    }
  }
})
