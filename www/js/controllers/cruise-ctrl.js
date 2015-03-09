controllers

.controller('CruiseCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.$on( 'realtime.update', function (event) {
    $scope.$apply()
  })

  $scope.switchWorkmode = function () {
    $scope.bike.setWorkmode((++$scope.bike.workmode)%3)
  }
  
  $scope.init = function () {
    $scope.bike = ActiveBLEDevice.get()
    $scope.bike.startMonitor()
  }

})
