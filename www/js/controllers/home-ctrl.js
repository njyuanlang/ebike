controllers

.controller('HomeCtrl', function($scope, $state, $ionicLoading, User,
  $localstorage, $cordovaVibration, $ionicPopup, $rootScope, $filter) {

  $scope.$on('realtime.update', function (event) {
    // if($rootScope.device.bike.workmode === 9 && $rootScope.device.realtime.power > 24) {
    //   $rootScope.device.setWorkmode(0)
    // }
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
          template: '<i class="icon ion-ios-information-outline padding"></i>'+$filter('translate')('OPEN_WITH_KEY'),
          duration: 2000
        })
      }
    } else {
      $ionicLoading.show({
        template: '<i class="icon ion-ios-information-outline padding"></i>'+$filter('translate')('REQUIRE_CONNECT_BIKE_TIPS'),
        duration: 2000
      })
    }
  }

  $scope.endure = function () {
    var device = $rootScope.device;
    if(!device.realtime.offline) {
      device.setWorkmode(9);
    } else {
      $ionicPopup.alert({
        title: '提示',
        template: '请开启电源！'
      });
    }
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
          template: '<i class="icon ion-ios-close-outline padding"></i>'+$filter('translate')('CONNECT_BIKE_FAILURE')+reason,
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
        title: $filter('translate')('TIPS'),
        template: $filter('translate')('CANCEL_PARKING_BEFORE_SWITCH')
      })
    } else if($rootScope.device.bike.workmode===46&&mode!==47) {
      $ionicPopup.alert({
        title: $filter('translate')('TIPS'),
        template: $filter('translate')('CANCEL_PUSHING_BEFORE_SWITCH')
      })
    } else {
      $rootScope.device.setWorkmode(mode);
    }
  }

  $scope.init = function () {
  }
})
