controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBike, $timeout, $ionicLoading) {
  
  $scope.healthScore = 0
  $scope.workmode = 0
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
    health()
    workstate()
  }
})
