controllers

.controller('CruiseCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.$on( 'realtime.update', function (event) {
    $scope.$apply()
  })

  $scope.switchWorkmode = function () {
    $scope.device.setWorkmode((++$scope.device.bike.workmode)%3)
  }
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    $scope.device.startMonitor()
  }

})
