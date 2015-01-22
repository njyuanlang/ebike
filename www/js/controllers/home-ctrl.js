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
  
  $scope.batteryDieEndure = function () {
    $scope.bleState = "Bluetooth is scaning"
        
    $cordovaBLE.scan([], 10).then(function (result) {     
       
      $scope.bleState += "Bluetooth is ON "+JSON.stringify(result)
      
      $cordovaBLE.connect(result.id)
      .then(function (result) {
        
        // var serviceUUID = 'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2'
        // var characteristicUUID = 'BEF8D6C9-9C21-4C9E-B632-BD58C1009F9F'
        var serviceUUID = 'FFE0'
        var characteristicUUID = 'FFE1'
        
        $scope.bleState += "Bluetooth is Connected "+JSON.stringify(result)
        $cordovaBLE.notify(result.id, serviceUUID, characteristicUUID).then(function (result) {
          $scope.bleState = "Bluetooth is notify "+bytesToString(result)
        }, function (error) {
          $scope.bleState = "Bluetooth is Failure notify "+JSON.stringify(arguments)
        })
        
        $cordovaBLE.write(result.id, serviceUUID, characteristicUUID, stringToBytes('a')).then(function (result) {
          $scope.bleState = "Bluetooth is Write "+JSON.stringify(result)
        }, function (error) {
          $scope.bleState = "Bluetooth is Failure Write "+JSON.stringify(arguments)
        })
        return result
      }, function (reason) {        
        $scope.bleState += "Bluetooth is Failure Connect"+JSON.stringify(arguments)
        return $q.reject(reason)
      })
      
    }, function (reason) {
            
      $scope.bleState += "Bluetooth is DISABLED"+JSON.stringify(arguments)
      $q.reject(reason)
    })
    .then(function (result) {
      $scope.bleState += "Bluetooth2 "+JSON.stringify(arguments)
    }, function (reason) {
      $scope.bleState += "Bluetooth2 "+JSON.stringify(arguments)
    })
  }
})
