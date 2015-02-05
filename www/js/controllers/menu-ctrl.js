controllers

.controller('MenuCtrl', function($scope, $state) {

})

.controller('HelpCtrl', function($scope, $state, ActiveBike) {
  $scope.realtime = {
    power: 0,
    mileage: 0,
    speed: 0,
    current: 0
  }
  
  $scope.test = {
    test: 0,
    repair: 0
  }
  
  $scope.device = {
    sn: '999',
    workmode: '123'
  }
  
  function startNotify() {
    ActiveBike.startNotifyPower(function (result) {
      $scope.realtime.power = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.realtime.power = reason
      $scope.$apply()
    })
    ActiveBike.startNotifyMileage(function (result) {
      $scope.realtime.mileage = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.realtime.mileage = reason
      $scope.$apply()
    })
    ActiveBike.startNotifySpeed(function (result) {
      $scope.realtime.speed = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.realtime.speed = reason
      $scope.$apply()
    })
    ActiveBike.startNotifyCurrent(function (result) {
      $scope.realtime.current = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.realtime.speed = reason
      $scope.$apply()
    })
  }

  function test() {
    ActiveBike.test(function (result) {
      $scope.test.test = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.test.test = reason || 0
      $scope.$apply()
    })
    ActiveBike.repair(function (result) {
      $scope.test.repair = result || 0
      $scope.$apply()
    }, function (reason) {
      $scope.test.repair = reason || 0
      $scope.$apply()
    })
  }
  
  function device(argument) {
    ActiveBike.device().then(function (result) {
      $scope.device.sn = result || 0
      $scope.$apply()
    },function (reason) {
      $scope.device.sn = reason
      $scope.$apply()
    })
    ActiveBike.workmode().then(function (result) {
      $scope.device.workmode = result || 0
      $scope.$apply()
    },function (reason) {
      $scope.device.workmode = reason
      $scope.$apply()
    })
  }
  
  $scope.refresh = function () {
    startNotify()
    test()
    device()
  }
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

.controller('MessagesDetailCtrl', function($scope, $state, $localstorage) {
  $scope.entities = $localstorage.getArray('com.extensivepro.ebike.CDF4843B-8C4D-4947-8FFB-7AA15B334F12')

  $scope.alertType = '电瓶低电压提醒'
})
