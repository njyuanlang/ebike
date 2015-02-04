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
    $scope.bleState = "Bluetooth is Start Notification"
    ActiveBike.startNotifyPower(function (result) {
      $scope.powerPercent = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.bleState += "ERROR: "+JSON.stringify(arguments)
      $scope.$apply()
    })
    ActiveBike.startNotifyMileage(function (result) {
      $scope.mileage = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.bleState += "ERROR: "+JSON.stringify(arguments)
      $scope.$apply()
    })
    ActiveBike.startNotifySpeed(function (result) {
      $scope.bleState += "Speed: "+JSON.stringify(arguments)
      $scope.$apply()
    }, function () {
      $scope.bleState += "ERROR: "+JSON.stringify(arguments)
      $scope.$apply()
    })
    ActiveBike.startNotifyCurrent(function (result) {
      $scope.bleState += "Current: "+JSON.stringify(arguments)
      $scope.$apply()
    }, function () {
      $scope.bleState += "ERROR: "+JSON.stringify(arguments)
      $scope.$apply()
    })
  }
  
  function test() {
    $scope.bleState = "Bluetooth is Start TEST"
    ActiveBike.test().then(function (result) {
      $scope.bleState += "Test success: "+JSON.stringify(arguments)
      $scope.healthScore = result || 100
    }, function (reason) {
      $scope.bleState += "TEST ERROR: "+JSON.stringify(arguments)
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
  }
  
  $scope.init = function () {
    ActiveBike.scan()
    
    $timeout(function () {
      ActiveBike.connect().then(function (result) {
        return ActiveBike.startNotifyRemind()
      }, function () {
        $scope.bleState += "Connect ERROR: "+JSON.stringify(arguments)
      })
    }, 2000)
  }
})
