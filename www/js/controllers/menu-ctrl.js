controllers

.controller('MenuCtrl', function($scope, $state, User) {

  // $scope.entity = User.getCurrent()
  
})

.controller('MessagesCtrl', function($scope, $state, ActiveBLEDevice) {

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
    $scope.bike = ActiveBLEDevice.get()
    $scope.bike.startReminder()
    $scope.entities = Object.keys($scope.bike.reminder)
  }
  
})

.controller('MessagesDetailCtrl', function($scope, $state, $stateParams, ActiveBLEDevice) {
  $scope.type = $stateParams.type
  $scope.init = function () {
    $scope.bike = ActiveBLEDevice.get()
    $scope.bike.fetchReminders($scope.type).then(function (result) {
      $scope.entities = result
    })
  }
})
