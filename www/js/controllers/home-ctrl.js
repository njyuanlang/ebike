controllers

.controller('HomeCtrl', function($scope, $state, $cordovaBLE, $q) {
  
  window.addEventListener("orientationchange", function() {
    // alert(window.orientation)
    if(Math.abs(window.orientation) === 90) {
      $state.go('cruise')
    } else {
      $state.go('home')
    }
  }, false);
  
  // var deregistration = $rootScope.$on('$stateChangeStart', cleanUp);
  
  function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
     }
     return array.buffer;
  }

  // ASCII only
  function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }
  
  $scope.batteryDieEndure = function () {
    
    var serviceUUID = 'FFE0'
    var characteristicUUID = 'FFE1'
      
    $scope.bleState = "Bluetooth is scaning"
    $cordovaBLE.scan([], 10).then(function (result) {
      $scope.bleState = "Bluetooth is ON "+JSON.stringify(result)
      $scope.peripheral = result
      return $cordovaBLE.connect(result.id)
    }, function (reason) {
      $scope.bleState = "Bluetooth is DISABLED"+JSON.stringify(arguments)
      $q.reject(reason)
    })
    .then(function (result) {
      $scope.bleState += "Bluetooth is Connected "+JSON.stringify(result)
      var promise = $cordovaBLE.notify($scope.peripheral.id, serviceUUID, characteristicUUID)
      $cordovaBLE.writeCommand($scope.peripheral.id, serviceUUID, characteristicUUID, stringToBytes('a'))
      return promise
    }, function (reason) {
      $scope.bleState += "Bluetooth is Failure Connect"+JSON.stringify(arguments)
      $q.reject(reason)
    })
    .then(function (result) {
      $scope.bleState += "Bluetooth is notify "+bytesToString(result)
      return $cordovaBLE.notify($scope.peripheral.id, serviceUUID, characteristicUUID)
    }, function (reason) {
      $scope.bleState += "Bluetooth is Failure notify "+JSON.stringify(arguments)
      $q.reject(reason)
    })
    .then(function (result) {
      $scope.bleState += "Bluetooth is notify222 "+bytesToString(result)
    })
  }
})
