controllers

.controller('LoginCtrl', function($scope, $state, ActiveBike, $timeout) {
  $scope.loginData = {}
  
  $scope.tryLogin = function (loginData) {
    // $state.go('home')
  }

  $scope.tryRegister = function (loginData) {
    // $state.go('home')
  }
  
  $scope.init = function () {
    $timeout(function () {
      ActiveBike.scan()
    }, 1000)
  }
})

.controller('RegisterCtrl', function($scope, $state) {

})

.controller('AccountCtrl', function($scope, $state) {
  
  $scope.entity = {
    name: 'Guan Bo',
    created: Date.now()
  }

  $scope.logout = function () {
    $state.go('login')
  }
})

