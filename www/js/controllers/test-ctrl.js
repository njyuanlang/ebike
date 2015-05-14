controllers

.controller('TestCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.$on( 'test.timeout', function () {
    $scope.device.test()
    $scope.task = $scope.device.task
  })

  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    if($scope.device && $scope.device.connected) {
      $scope.device.test()
      $scope.task = $scope.device.task
    }
  }
})
