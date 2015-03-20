controllers

.controller('LoginCtrl', function($scope, $rootScope, $state, $timeout, $window) {
  
  $scope.entity = {}
  
  $scope.tryLogin = function (entity) {
    $rootScope.online = true
    $state.go('home')
  }

  $scope.goRegister = function (entity) {
    $rootScope.online = true
    $state.go('register')
  }
  
  $scope.goTrial = function () {
    $rootScope.online = false
    $state.go('home')
  }
  
  $scope.init = function () {
    $timeout(function () {
      if($window.ble) ble.scan([], 5)
    }, 1000)
  }
})

.controller('RegisterCtrl', function($scope, $state, $interval, $ionicLoading, User, $localstorage) {
  
  $scope.entity = {username: "13357828347", password: "123456"}
  $scope.validprompt = "获取验证码"
  
  $scope.getValidcode = function () {
    if($scope.disableValidcode) return
    $scope.disableValidcode = true
    $scope.elapse = 120
    $scope.promise = $interval(function () {
      if(--$scope.elapse === 0) {
        $interval.cancel($scope.promise)
        $scope.disableValidcode = false
        $scope.validprompt = "获取验证码"
      } else {
        $scope.validprompt = $scope.elapse+"秒后重试"
      }
    }, 1000)
  }
  
  $scope.tryRegister = function () {
    var entity = $scope.entity
    entity.email = entity.username+"@example.com"
    entity.realm = "client"

    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>正在注册新账户...'
    })

    User.create(entity, function (user) {
      User.login(entity, function (accessToken) {
        $ionicLoading.show({
          template: '<i class="icon ion-ios7-checkmark-outline padding"></i>注册账户成功',
          duration: 1000
        })
        $localstorage.setObject('$EBIKE$LoginData', $scope.entity)
        $state.go('provinces')
      })
    }, function (res) {
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-close-outline padding"></i>手机已经存在，请换其他手机',
        duration: 2000
      })
    })
  }
})

.controller('AccountCtrl', function($scope, $state, ActiveBLEDevice) {
  
  $scope.entity = {
    name: 'Guan Bo',
    created: Date.now()
  }

  $scope.logout = function () {
    ActiveBLEDevice.get().disconnect()
    $state.go('login')
  }
})

.controller('ProvincesCtrl', function ($scope, $state, ChinaRegion) {
  $scope.entities = ChinaRegion.provinces
  $scope.goCities = function (item) {
    $state.go('cities', {province: JSON.stringify(item)})
  }
})

.controller('CitiesCtrl', function ($scope, $state, ChinaRegion) {
  $scope.entities = JSON.parse($state.params.province).sub
  
})

