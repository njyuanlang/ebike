controllers

.controller('LoginCtrl', function($scope, $rootScope, $state, ActiveBike, $timeout) {
  $scope.loginData = {}
  
  $scope.tryLogin = function (loginData) {
    $rootScope.online = true
    ActiveBike.autoconnect().then(function (result) {
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
      ActiveBike.scan()
    }, 1000)
  }
})

.controller('RegisterCtrl', function($scope, $state) {

})

.controller('AccountCtrl', function($scope, $state, ActiveBike) {
  
  $scope.entity = {
    name: 'Guan Bo',
    created: Date.now()
  }

  $scope.logout = function () {
    ActiveBike.disconnect()
    $state.go('login')
  }
})

