controllers

.controller('LoginCtrl', function($scope, $rootScope, $state, ActiveBLEDevice, $timeout) {
  
  $scope.loginData = {}
  
  $scope.tryLogin = function (loginData) {
    $rootScope.online = true
    $scope.device = ActiveBLEDevice.get()
    $scope.device.autoconnect().then(function (result) {
      $state.go('home')
    }, function (reason) {
      $state.go('brands')
    })
  }

  $scope.tryRegister = function (loginData) {
  }
  
  $scope.goTrial = function () {
    $rootScope.online = false
    $state.go('home')
  }
  
  $scope.init = function () {
    $timeout(function () {
      ble.scan([], 5)
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

