controllers

.controller('HomeCtrl', function($scope, $state, ActiveBLEDevice, TestTask, $ionicLoading, BikeService) {
    
  $scope.$on( 'realtime.update', function (event) {
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
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    if($scope.device) {
      $scope.device.autoconnect().then(function (result) {
        $scope.task = new TestTask()
        $scope.device.test($scope.task)
      }, function (reason) {
        registerBike()
      })
    } else {
      registerBike()
    }
  }
})
