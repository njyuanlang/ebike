controllers

.controller('TestCtrl', function($scope, $state) {
  
  $scope.$on( 'test.timeout', function () {
    $scope.device.test()
    $scope.task = $scope.device.task
  })

  $scope.init = function () {
    if($scope.device && $scope.device.status === 'connected') {
      $scope.device.test()
      $scope.task = $scope.device.task
    }
  }
})
