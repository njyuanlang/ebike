controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBike, $timeout, $ionicLoading) {
  
  $scope.powerPercent = 0
  $scope.mileage = 0
  $scope.healthScore = 100
  $scope.workmode = 0
  
  function startNotify() {
    ActiveBike.notify('power', function (result) {
      $scope.powerPercent = result || 0
      // $scope.$apply()
    }, function (reason) {
      // $scope.$apply()
    })
    ActiveBike.notify('mileage', function (result) {
      $scope.mileage = result || 0
      // $scope.$apply()
    }, function (reason) {
      // $scope.$apply()
    })
  }
  
  function health() {
    ActiveBike.health().then(function (result) {
      $scope.healthScore = result || 0
    }, function (reason) {
      // $scope.healthScore = reason
    })
  }
  
  function workstate() {
    ActiveBike.workmode()
    .then(function (result) {
      $scope.workstate = result
    }, function (reason) {
      
    })
  }
  
  $scope.switchWorkmode = function (mode) {
    $scope.workmode = mode
    ActiveBike.setWorkmode(mode)
  }
  
  $scope.batteryDieEndure = function () {
    startNotify()
    health()
  }
  
  $scope.init = function () {
    startNotify()
    health()
    workstate()
  }
})
