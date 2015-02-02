controllers

.controller('MenuCtrl', function($scope, $state) {

})

.controller('MessagesCtrl', function($scope, $state) {

  $scope.setting = false;
  $scope.rightButtonTitle = '设置'
  
  $scope.entities = [
    {"name": "电瓶低电压提醒", checked: true},
    {"name": "超载提醒", checked: true},
    {"name": "温度过高提醒", checked: true},
    {"name": "防盗提醒", checked: true}
  ]
  
  $scope.doSetting = function () {
    if($scope.setting) {
      $scope.rightButtonTitle = '设置'
    } else {
      $scope.rightButtonTitle = '保存'
    }
    $scope.setting = !$scope.setting;
  }
  
  $scope.goDetail = function () {
    $state.go('messages-detail')
  }
})

.controller('MessagesDetailCtrl', function($scope, $state) {

})
