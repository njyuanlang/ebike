controllers

.controller('MenuCtrl', function($scope, $state, User) {

  // $scope.entity = User.getCurrent()
  
})

.controller('MessagesCtrl', function($scope, $state, $rootScope) {

  $scope.setting = false;
  $scope.rightButtonTitle = '设置'
    
  $scope.doSetting = function () {
    if($scope.setting) {
      $scope.bike.save()
      $scope.rightButtonTitle = '设置'
    } else {
      $scope.rightButtonTitle = '保存'
    }
    $scope.setting = !$scope.setting;
  }
  
  $scope.init = function () {
    $scope.device.startReminder()
    $scope.entities = Object.keys($scope.device.reminder)
  }
  
})

.controller('MessagesDetailCtrl', function($scope, $state, $stateParams) {
  $scope.type = $stateParams.type
  $scope.init = function () {
    $scope.device.fetchReminders($scope.type).then(function (result) {
      $scope.entities = result
    })
  }
})
