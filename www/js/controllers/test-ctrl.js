controllers

.controller('TestCtrl', function($scope, $state, $interval, TestTask) {

  $scope.task = new TestTask()
  
  $scope.$on('$destory', function () {
    $interval.cancel($scope.testPromise)
  })
  
  $scope.init = function () {
    $scope.task.test()
  }
})
