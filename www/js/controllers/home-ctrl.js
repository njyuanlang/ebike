controllers

.controller('HomeCtrl', function($scope, $state, $cordovaBLE, $q, ActiveBike, $timeout) {
  
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
  
  function byteToDecString(buffer) {
    return new Uint8Array(buffer)[0].toString(10)
  }
  
  function notificationSuccess(result) {
    $scope.bleState += "SUCCESS: " + byteToDecString(result)
    $scope.$apply()
  }
  function notificationError(reason) {
    $scope.bleState += "ERROR: "+JSON.stringify(arguments)
    $scope.$apply()
  }
  function fresh() {
    var services = [
      {
        uuid: "0000D000-D102-11E1-9B23-00025B00A5A5",
        characteristics: [
          "0000D00A-D102-11E1-9B23-00025B00A5A5"
          // , "0000D00B-1021-1E19-B230-00250B00A5A5"
        ]
      }
    ]
      
    $scope.bleState = "Bluetooth is Start Notification"
    // ActiveBike.read("0000D000-D102-11E1-9B23-00025B00A5A5", "0000D00A-D102-11E1-9B23-00025B00A5A5")
    // .then(function (result) {
    //   $scope.bleState += "SUCCESS: "+ byteToDecString(result)
    // }, function (reason) {
    //   $scope.bleState += "ERROR: "+JSON.stringify(arguments)
    // })
    // ActiveBike.startNotifications(services, notificationSuccess, notificationError)
    ActiveBike.startNotification("0000D000-D102-11E1-9B23-00025B00A5A5", 
      "0000D00A-D102-11E1-9B23-00025B00A5A5", 
      function (result) {
        $scope.bleState += "Power: " + byteToDecString(result)
        $scope.$apply()
      }, function (reason) {
        $scope.bleState += "ERROR: "+JSON.stringify(arguments)
        $scope.$apply()
      }
    )
    ActiveBike.startNotification("0000D000-D102-11E1-9B23-00025B00A5A5", 
    "0000D00B-1021-1E19-B230-00250B00A5A5", 
    function (result) {
      $scope.bleState += "MILES: " + byteToDecString(result)
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
  
  $scope.batteryDieEndure = function () {
    fresh()
  }
  
  $scope.init = function () {
    ActiveBike.scan()
    
    $timeout(function () {
      ActiveBike.connect()
    }, 2000)
  }
})
