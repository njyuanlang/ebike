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
  
  function notify(notify, service, characteristic) {
    ActiveBike[notify](function (result) {
      var d = new Date()
      $scope[service][characteristic] = result || 0
      $scope[service][characteristic] += ' @ '+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
      $scope.$apply()
    }, function (reason) {
      $scope[service][characteristic] = reason
      $scope.$apply()
    })
  }
  
  function startNotify() {
    notify('startNotifyPower', 'realtime', 'power')
    notify('startNotifyMileage', 'realtime', 'mileage')
    notify('startNotifySpeed' , 'realtime', 'speed')
    notify('startNotifyCurrent', 'realtime', 'current')
  }

  function test() {
    notify('test', 'test', 'test')
    notify('repair', 'test', 'repair')
  }
  
  function read(fn, service, characteristic) {
    ActiveBike[fn]().then(function (result) {
      $scope[service][characteristic] = result || 0
      $scope.$apply()
    },function (reason) {
      $scope[service][characteristic] = reason
      $scope.$apply()
    })
  }
  function device(argument) {
    read('device', 'device', 'sn')
    read('workmode', 'device', 'workmode')
  }
  
  $scope.refresh = function () {
    device()
    startNotify()
    test()
  }
  
  $scope.switchMode = function () {
    ActiveBike.setWorkmode()
    device()
  }
  
  $scope.test = test
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
