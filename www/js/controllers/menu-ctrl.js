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
  
  function notify(service, characteristic) {
    ActiveBike.notify(service, characteristic, function (result) {
      var d = new Date()
      $scope[service][characteristic] = result || 0
      $scope[service][characteristic] += ' '+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
      $scope.$apply()
    }, function (reason) {
      $scope[service][characteristic] = reason
      $scope.$apply()
    })
  }
  
  function startNotify() {
    notify('realtime', 'power')
    notify('realtime', 'mileage')
    notify('realtime', 'speed')
    notify('realtime', 'current')
  }

  function test() {
    notify('test', 'test')
  }
  function repair(argument) {
    notify('test', 'repair')
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
    repair()
  }
  
  $scope.switchMode = function () {
    ActiveBike.setWorkmode()
    device()
  }
  
  $scope.test = test
  $scope.repair = repair
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
