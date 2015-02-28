controllers

.controller('TestCtrl', function($scope, $state, $interval, TestTask, ActiveBLEDevice) {
  
  // $scope.$watch('task.state', function () {
  // })
  //
  $scope.init = function () {
    $scope.task = new TestTask(ActiveBLEDevice.get())
    $scope.task.startTest()
  }
  
})
