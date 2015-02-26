controllers

.controller('TestCtrl', function($scope, $state, $interval, TestTask, ActiveBLEDevice) {
  
  $scope.init = function () {
    $scope.task = new TestTask(ActiveBLEDevice.get())
    $scope.task.startTest()
  }
  
})
