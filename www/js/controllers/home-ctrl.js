controllers

.controller('HomeCtrl', function($scope, $state, $ionicLoading, User,
  $localstorage, $translate, $cordovaVibration, $ionicPopup) {

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
    if(!$scope.online) return $scope.device.onConnected();
    if(!$scope.currentUser) return console.log('return due to anoymous: '+$scope.device);;
    if(!$scope.currentBike || !$scope.currentBike.id) {
      $state.go('brands', {id:'create'});
    } else {
      reconnectDevice();
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
    // $scope.device.status = 'connecting';
    // return setTimeout(function () {
    //   $scope.device.status = 'disconnected';
    //   $scope.$apply();
    // }, 5000);
    if(!$scope.device || $scope.device.status!='disconnected') return;
    if(!$scope.online) return $scope.device.onConnected()

    $scope.device.autoconnect().then(function (result) {

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
    if($scope.device.bike.workmode===30&&mode!==30) {
      $ionicPopup.alert({
        title: '提示',
        template: '请点击智能泊车按钮，取消泊车状态再切换到其他状态'
      })
    } else if($scope.device.bike.workmode===46&&mode!==46) {
      $ionicPopup.alert({
        title: '提示',
        template: '请点击智能推行按钮，取消推行状态再切换到其他状态'
      })
    } else {
      $scope.device.setWorkmode(mode);
    }
  }
  $scope.init = function () {
  }
})
