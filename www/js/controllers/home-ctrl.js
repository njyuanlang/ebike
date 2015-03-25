controllers

.controller('HomeCtrl', function($scope, $state, ActiveBLEDevice, TestTask, $ionicLoading, BikeService, User, $localstorage) {
    
  $scope.$on( 'realtime.update', function (event) {
    if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
      $scope.device.setWorkmode(0)
    }
    $scope.$apply()
  })
  
  $scope.endure = function () {
    $scope.device.setWorkmode(9)
  }
  
  var registerBike = function () {
    $state.go('brands', {id:'create'})
    $ionicLoading.show({
      template: '<i class="icon ion-ios7-checkmark-outline padding"></i>请注册车辆',
      duration: 3000
    })
  }
  
  var reconnectDevice = function () {
    $scope.device = ActiveBLEDevice.get()
    if($scope.device) {
      $scope.device.autoconnect().then(function (result) {
      }, function (reason) {
        registerBike()
      })
    } else {
      registerBike()
    }
  }
  
  $scope.$on('home.reconnect', function () {
    reconnectDevice()
  })
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    var loginData = $localstorage.getObject('$EBIKE$LoginData')
    if(!loginData.username || !loginData.password) {
      $state.go('login')
    } else {
      User.login(loginData, function (user) {
        reconnectDevice()
      })
    }
  }
})
