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

  $scope.goRegister = function (loginData) {
    $state.go('register')
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

.controller('RegisterCtrl', function($scope, $state, $interval) {
  
  $scope.entity = {}
  $scope.validprompt = "获取验证码"
  
  $scope.getValidcode = function () {
    if($scope.disableValidcode) return
    $scope.disableValidcode = true
    $scope.elapse = 120
    $scope.promise = $interval(function () {
      if(--$scope.elapse === 0) {
        $interval.cancel($scope.promise)
        $scope.disableValidcode = false
        $scope.validprompt = "获取验证码"
      } else {
        $scope.validprompt = $scope.elapse+"秒后重试"
      }
    }, 1000)
  }
  
  $scope.tryRegister = function () {
    
  }
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

