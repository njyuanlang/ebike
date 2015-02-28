controllers

.controller('MenuCtrl', function($scope, $state) {

})

.controller('HelpCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.$on( 'realtime.update', function (event) {
    var d = new Date()
    $scope.updated = d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
  })
  
  $scope.test = {
    test: 0,
    repair: 0
  }
    
  function test(method) {
    $scope.device[method](function (result) {
      var d = new Date()
      test[method] = result+' '+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
      $scope.$apply()
    }, function (reason) {
      test[method] = reason
      $scope.$apply()
    })
  }
  
  $scope.refresh = function () {
    $scope.device = ActiveBLEDevice.get()
    $scope.device.startMonitor()
  }
  
  $scope.switchMode = function () {
    $scope.device.setWorkmode((++$scope.device.workmode)%3)
  }
  
  $scope.test = test
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
