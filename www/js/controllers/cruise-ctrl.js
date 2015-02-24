controllers

.controller('CruiseCtrl', function($scope, $state, ActiveBike) {
  
  $scope.realtime = ActiveBike.realtime()
  $scope.bike = ActiveBike
  
  $scope.switchWorkmode = function () {
    ActiveBike.setWorkmode((++ActiveBike.workmode)%3)
  }

})
