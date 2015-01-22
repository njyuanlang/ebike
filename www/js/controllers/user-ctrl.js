controllers

.controller('LoginCtrl', function($scope, $state) {
  $scope.loginData = {}
  
  $scope.tryLogin = function (loginData) {
    $state.go('home')
  }

  $scope.tryRegister = function (loginData) {
    // $state.go('home')
  }
    
})

.controller('RegisterCtrl', function($scope, $state) {

})