controllers

.controller('HomeCtrl', function($scope, $state, ActiveBLEDevice, $ionicLoading, User, $localstorage, $ionicHistory, $rootScope, $ionicPlatform) {
    
  $scope.$on( 'realtime.update', function (event) {
    if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
      $scope.device.setWorkmode(0)
    }
    $scope.$apply()
  })
  
  $scope.$on('$ionicView.enter', function (event) {
    $scope.device = ActiveBLEDevice.get()
    if(!$scope.online) return $scope.device.onConnected()

    $scope.deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(function () {
      $scope.device.disconnect().then(function () {
        ionic.Platform.exitApp();
      }, function () {
        ionic.Platform.exitApp();
      });
    }, 100);
  })

  $scope.$on("$ionicView.leave", function () {
    if($scope.deregisterBackButtonAction) $scope.deregisterBackButtonAction();
  })

  $scope.goTest = function () {
    if($scope.device.status === 'connected') {
      $state.go('test')
    } else {
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-information-outline padding"></i>请连接车辆',
        duration: 2000
      })
    }
  }
  
  $scope.endure = function () {
    $scope.device.setWorkmode(9)
  }
  
  var registerBike = function () {
    $state.go('brands', {id:'create'})
    $ionicLoading.show({
      template: '<i class="icon ion-ios7-information-outline padding"></i>请注册车辆',
      duration: 1000
    })
  }
  
  var reconnectDevice = function () {
    if(!$scope.online) return $scope.device.onConnected()
    
    if($scope.device.bike.id) {
      $scope.device.autoconnect().then(function (result) {
        $ionicLoading.show({
          template: '<i class="icon ion-ios7-checkmark-outline padding"></i>已成功连接到车辆',
          duration: 1000
        });
      }, function (reason) {
        if(reason === 'no localId') {
          $state.go('bikes-add')
        } else if(reason === 'connecting') {
          console.debug('prevent from contiuning autoconnect');
        } else {
          $ionicLoading.show({
            template: '<i class="icon ion-ios7-close-outline padding"></i>连接失败：'+reason,
            duration: 2000
          })
        }
      })
    } else {
      registerBike()
    }
  }
  
  $scope.reconnectDevice = reconnectDevice
  
  $scope.$on('home.reconnect', reconnectDevice);
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    if(!$scope.online) return $scope.device.onConnected()

    if(!User.isAuthenticated()) {
      $state.go('entry')
    } else {

    }
  }
})
