controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBike, $timeout, $ionicLoading) {
  
  $scope.powerPercent = 0
  $scope.mileage = 0
  $scope.healthScore = 100
  $scope.workstate = 'downhill'
  
  function startNotify() {
    ActiveBike.startNotifyPower(function (result) {
      $scope.powerPercent = result || 0
      $scope.$apply()
    }, function (reason) {
      // $scope.$apply()
    })
    ActiveBike.startNotifyMileage(function (result) {
      $scope.mileage = result || 0
      $scope.$apply()
    }, function (reason) {
      // $scope.$apply()
    })
  }
  
  function health() {
    ActiveBike.health().then(function (result) {
      $scope.healthScore = result || 0
    }, function (reason) {
      $scope.healthScore = reason
    })
  }
  
  function workstate() {
    ActiveBike.state()
    .then(function (result) {
      
    }, function (reason) {
      
    })
  }
  
  $scope.batteryDieEndure = function () {
    startNotify()
    health()
  }
  
  $scope.init = function () {
    // health()
  }
  
})
