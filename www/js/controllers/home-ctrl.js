controllers

.controller('HomeCtrl', function($scope, $state, $ionicLoading, User,
  $localstorage, $translate, $cordovaVibration, $ionicPopup, $rootScope) {

  var translations = {
    OPEN_WITH_KEY: '',
    REQUIRE_CONNECT_BIKE_TIPS: '',
    CONNECT_BIKE_FAILURE: ''
  };
  $translate(Object.keys(translations)).then(function (result) {
    translations = result;
  });

  $scope.$on('realtime.update', function (event) {
    if($rootScope.device.bike.workmode === 9 && $rootScope.device.realtime.power > 24) {
      $rootScope.device.setWorkmode(0)
    }
    $scope.$apply()
  })

  $scope.$on('$ionicView.enter', function (event) {
    if(!$scope.online) return $rootScope.device.onConnected();
    if(!$scope.currentUser) return console.log('return due to anoymous: '+$rootScope.device);;
    reconnectDevice();
  })

  $scope.goTest = function () {
    if($rootScope.device.status === 'connected') {
      if(!$rootScope.device.realtime.offline) {
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
    $rootScope.device.setWorkmode(9)
  }

  var reconnectDevice = function () {
    // $rootScope.device.status = 'connecting';
    // return setTimeout(function () {
    //   $rootScope.device.status = 'disconnected';
    //   $scope.$apply();
    // }, 5000);
    if(!$scope.currentBike || !$scope.currentBike.id) {
      return $state.go('brands', {id:'create'});
    }
    if(!$rootScope.device) {
      return $state.go('tab.home-bind');
    } else if($rootScope.device.status!='disconnected') {
      return console.log('reconnectDevice status:'+$rootScope.device.status);
    }
    if(!$scope.online) return $rootScope.device.onConnected()

    $rootScope.device.autoconnect().then(function (result) {

    }, function (reason) {
      console.log('Reconnect Error:'+reason);
      if(reason === 'no localId') {
        $state.go('tab.home-bind')
      } else if(reason === 'connecting') {
        console.log('prevent from contiuning autoconnect');
      } else if(reason === 'timeout') {
        // $scope.$apply();
      } else {
        if(/not find/.test(reason)) reason = '没有找到车辆，请靠近车辆重试！';
        $ionicLoading.show({
          template: '<i class="icon ion-ios-close-outline padding"></i>'+translations.CONNECT_BIKE_FAILURE+reason,
          duration: 2000
        })
      }
    });
  }

  $scope.reconnectDevice = reconnectDevice

  $scope.$on('home.reconnect', reconnectDevice);

  $scope.setWorkmode = function (mode) {
    if($rootScope.device.bike.workmode===30&&mode!==31) {
      $ionicPopup.alert({
        title: '提示',
        template: '请点击智能泊车按钮，取消泊车状态再切换到其他状态'
      })
    } else if($rootScope.device.bike.workmode===46&&mode!==47) {
      $ionicPopup.alert({
        title: '提示',
        template: '请点击智能推行按钮，取消推行状态再切换到其他状态'
      })
    } else {
      $rootScope.device.setWorkmode(mode);
    }
  }
  $scope.init = function () {
    if($localstorage.get('$EBIKE$IsNewbie', "YES") === "YES") {
      $localstorage.set('$EBIKE$IsNewbie', "NO")
      $state.go('intro')
    }
  }
})
