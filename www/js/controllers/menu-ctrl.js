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

.controller('MessagesCtrl', function($scope, $state, Reminder) {

  $scope.setting = false;
  $scope.rightButtonTitle = '设置'
  
  $scope.config = Reminder.getConfig()
  $scope.entities = Object.keys($scope.config)
  
  $scope.doSetting = function () {
    if($scope.setting) {
      Reminder.setConfig($scope.config)
      $scope.rightButtonTitle = '设置'
    } else {
      $scope.rightButtonTitle = '保存'
    }
    $scope.setting = !$scope.setting;
  }
  
})

.controller('MessagesDetailCtrl', function($scope, $state, $stateParams, Reminder) {
  var type = $stateParams.type
  var remind = Reminder.getConfig()[type]
  $scope.entities = Reminder.getRemind(type).reverse()
  $scope.title = remind.name
})
