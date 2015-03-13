controllers

.controller('HomeCtrl', function($scope, $state, ActiveBLEDevice, TestTask) {
    
  $scope.$on( 'realtime.update', function (event) {
    $scope.$apply()
  })
    
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    $scope.task = new TestTask()
    $scope.device.startMonitor()
    $scope.device.test($scope.task)
  }
})
