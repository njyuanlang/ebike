controllers

.controller('HomeCtrl', function($scope, $state, $q, ActiveBike, $timeout) {
  
  window.addEventListener("orientationchange", function() {
    // alert(window.orientation)
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
    
    // .then(function (result) {
    //   $scope.bleState += "Bluetooth is Connected "+JSON.stringify(result)
    //   var promise = $cordovaBLE.notify($scope.peripheral.id, serviceUUID, characteristicUUID)
    //   $cordovaBLE.writeCommand($scope.peripheral.id, serviceUUID, characteristicUUID, stringToBytes('a'))
    //   return promise
    // }, function (reason) {
    //   $scope.bleState += "Bluetooth is Failure Connect"+JSON.stringify(arguments)
    //   $q.reject(reason)
    // })
    // .then(function (result) {
    //   $scope.bleState += "Bluetooth is notify "+bytesToString(result)
    //   return $cordovaBLE.notify($scope.peripheral.id, serviceUUID, characteristicUUID)
    // }, function (reason) {
    //   $scope.bleState += "Bluetooth is Failure notify "+JSON.stringify(arguments)
    //   $q.reject(reason)
    // })
  }
  
  function test() {
    ActiveBike.startNotifyTest(function (result) {
      $scope.healthScore = result || 100
    }, function (reason) {
      
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
      ActiveBike.connect()
    }, 2000)
  }
})
