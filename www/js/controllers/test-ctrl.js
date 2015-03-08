controllers

.controller('TestCtrl', function($scope, $state, TestTask, ActiveBLEDevice) {
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    $scope.task = new TestTask()
    $scope.device.test($scope.task)
  }
})