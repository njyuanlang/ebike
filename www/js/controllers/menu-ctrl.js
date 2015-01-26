controllers

.controller('MenuCtrl', function($scope, $state) {

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
