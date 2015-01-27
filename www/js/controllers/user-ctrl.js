controllers

.controller('LoginCtrl', function($scope, $state) {
  $scope.loginData = {}
  
  $scope.tryLogin = function (loginData) {
    // $state.go('home')
  }

  $scope.tryRegister = function (loginData) {
    // $state.go('home')
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

