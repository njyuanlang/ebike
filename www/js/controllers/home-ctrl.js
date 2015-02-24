controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBike, $timeout, $ionicLoading) {
  
  $scope.bike = ActiveBike
  $scope.healthScore = 0
  $scope.realtime = ActiveBike.realtime()
    
  function startNotify() {
    ActiveBike.notify('realtime', 'power', function (result) {
      // $scope.powerPercent = result || 0
      // $scope.$apply()
    }, function (reason) {
      // $scope.$apply()
    })
    ActiveBike.notify('realtime', 'mileage', function (result) {
      // $scope.mileage = result || 0
      // $scope.$apply()
    }, function (reason) {
      // $scope.$apply()
    })
  }
  
  function health() {
    ActiveBike.health().then(function (result) {
      $scope.healthScore = result || 0
      // $scope.$apply()
    }, function (reason) {
      // $scope.healthScore = reason
    })
  }
  
  $scope.batteryDieEndure = function () {
    health()
  }
  
  $scope.init = function () {
    health()
  }
})
