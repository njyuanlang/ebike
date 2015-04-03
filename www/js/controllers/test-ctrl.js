controllers

.controller('TestCtrl', function($scope, $state, TestTask, ActiveBLEDevice) {
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    $scope.device.test()
    $scope.task = $scope.device.task
  }
})
