controllers

.controller('HomeCtrl', function($scope, $state, ActiveBLEDevice, TestTask) {
    
  $scope.$on( 'realtime.update', function (event) {
    $scope.$apply()
  })
    
  $scope.init = function () {
    $scope.bike = ActiveBLEDevice.get()
    $scope.task = new TestTask()
    $scope.bike.startMonitor()
    $scope.bike.test($scope.task)
  }
})
