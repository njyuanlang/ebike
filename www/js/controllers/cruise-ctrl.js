controllers

.controller('CruiseCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.$on( 'realtime.update', function (event) {
    if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
      $scope.device.setWorkmode(0)
    }
    $scope.$apply()
  })

  $scope.switchWorkmode = function () {
    $scope.device.setWorkmode((++$scope.device.bike.workmode)%3)
  }
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
  }

})
