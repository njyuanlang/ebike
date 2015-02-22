controllers

.controller('TestCtrl', function($scope, $state, $interval, TestTask) {

  $scope.task = new TestTask()
  
  $scope.init = function () {
    $scope.task.test()
  }
})
