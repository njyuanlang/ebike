controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBike, $timeout) {
  
  window.addEventListener("orientationchange", function() {
    if(Math.abs(window.orientation) === 90) {
      $state.go('cruise')
    } else {
      $state.go('home')
    }
  }, false);
  
  // var deregistration = $rootScope.$on('$stateChangeStart', cleanUp);
  
  $scope.powerPercent = 0
  $scope.mileage = 0
  $scope.healthScore = 100
  $scope.workstate = 'downhill'
  
  function startNotify() {
    ActiveBike.startNotifyPower(function (result) {
      $scope.powerPercent = result || 0
      $scope.$apply()
    }, function (reason) {
      // $scope.bleState += "ERROR: "+JSON.stringify(arguments)
      // $scope.$apply()
    })
    ActiveBike.startNotifyMileage(function (result) {
      $scope.mileage = result || 0
      $scope.$apply()
    }, function (reason) {
      // $scope.bleState += "ERROR: "+JSON.stringify(arguments)
      // $scope.$apply()
    })
  }
  
  function test() {
    ActiveBike.test(function (result) {
      $scope.healthScore = result || 0
    }, function (reason) {
      $scope.healthScore = -1
      // $scope.bleState += "TEST ERROR: "+JSON.stringify(arguments)
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
    test()
  }
  
  $scope.init = function () {
    ActiveBike.autoconnect()
    .then(function () {
      startNotify()
      test()
    }, function () {
    })
  }
  
})
