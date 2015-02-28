controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBLEDevice, TestTask, $ionicLoading) {
    
  $scope.$on( 'realtime.update', function (event) {
  })
    
  $scope.init = function () {
    $scope.bike = ActiveBLEDevice.get()
    $scope.task = new TestTask($scope.bike)
    $scope.bike.startMonitor()
    $scope.task.health()
  }
})
