controllers

.controller('CruiseCtrl', function($scope, $state, ActiveBike) {
  
  $scope.realtime = ActiveBike.realtime()
  $scope.workmode = 0

})
