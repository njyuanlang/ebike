controllers

.controller('LoginCtrl', function($scope, $rootScope, $state, ActiveBLEDevice, $timeout, $window) {
  
  $scope.loginData = {}
  
  $scope.tryLogin = function (loginData) {
    $rootScope.online = true
    $scope.device = ActiveBLEDevice.get()
    if($scope.device) {
      $scope.device.autoconnect().then(function (result) {
        $state.go('home')
      }, function (reason) {
        $state.go('brands', {id:'create'})
      })
    } else {
      $state.go('brands', {id:'create'})
    }
  }

  $scope.tryRegister = function (loginData) {
  }
  
  $scope.goTrial = function () {
    $rootScope.online = false
    $state.go('home')
  }
  
  $scope.init = function () {
    $timeout(function () {
      if($window.ble) ble.scan([], 5)
    }, 1000)
  }
})

.controller('RegisterCtrl', function($scope, $state) {

})

.controller('AccountCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.entity = {
    name: 'Guan Bo',
    created: Date.now()
  }

  $scope.logout = function () {
    ActiveBLEDevice.get().disconnect()
    $state.go('login')
  }
})

