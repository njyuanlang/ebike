controllers

.controller('LoginCtrl', function($scope, $rootScope, $state, User, $ionicLoading, $filter, $localstorage) {
  
  $scope.entity = {realm: 'client'}
  
  $scope.tryLogin = function () {
    $rootScope.online = true
    
    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>登录中...'
    })
    User.login($scope.entity, function (user) {
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-checkmark-outline padding"></i>登录成功',
        duration: 1000
      })
      $localstorage.setObject('$EBIKE$LoginData', $scope.entity)
      $state.go('home')
    }, function (res) {
      var option = {
        template: '<i class="icon ion-ios7-close-outline padding"></i>',
        duration: 2000
      }
      option.template += $filter('loginErrorPrompt')(res.data.error.message)
      $ionicLoading.show(option)      
    })
  }

  $scope.goRegister = function (entity) {
    $rootScope.online = true
    $state.go('register')
  }
  
  $scope.goTrial = function () {
    $rootScope.online = false
    $state.go('home')
  }
})

.controller('RegisterCtrl', function($scope, $state, $interval, $ionicLoading, User, $localstorage, Authmessage, $filter) {
  
  $scope.entity = {username: "13357828347", password: "123456"}
  $scope.validprompt = "获取验证码"
  
  $scope.getAuthcode = function () {
    if($scope.disableValidcode) return
    $scope.disableValidcode = true
    $scope.elapse = 60
    $scope.promise = $interval(function () {
      if(--$scope.elapse === 0) {
        $interval.cancel($scope.promise)
        $scope.disableValidcode = false
        $scope.validprompt = "获取验证码"
      } else {
        $scope.validprompt = $scope.elapse+"秒后重试"
      }
    }, 1000)
    
    Authmessage.create({phone: $scope.entity.username})
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
      var option = {
        template: '<i class="icon ion-ios7-close-outline padding"></i>',
        duration: 2000
      }
      option.template += $filter('registerErrorPrompt')(res.data.error.message)
      $ionicLoading.show(option)
    })
  }
})

.controller('AccountCtrl', function($scope, $state, ActiveBLEDevice, User, $localstorage, $ionicHistory) {
  
  $scope.entity = User.getCurrent()

  $ionicHistory.registerHistory($scope)
  $scope.logout = function () {
    var device = ActiveBLEDevice.get()
    if(device) device.disconnect()
    
    $localstorage.setObject('$EBIKE$LoginData')
    User.logout()
    $state.go('login')
  }  
})

.controller('ProvincesCtrl', function ($scope, $state, ChinaRegion) {
  $scope.entities = ChinaRegion.provinces
  $scope.goCities = function (item) {
    $state.go('cities', {province: JSON.stringify(item)})
  }
})

.controller('CitiesCtrl', function ($scope, $state, ChinaRegion, User, $ionicHistory, $window) {
  var province = JSON.parse($state.params.province)
  $scope.entities = province.sub
  
  $scope.selectEntity = function (item) {
    User.getCurrent(function (user) {
      user.region = {
        province: province.name,
        city: item.name
      }
      User.prototype$updateAttributes({ id: user.id }, { region: user.region}, function () {
        var viewHistory = $ionicHistory.viewHistory()
        console.log(viewHistory)
        // var views = viewHistory.histories.root.stack
        // views[views.length-3].go()
        $ionicHistory.goToHistoryRoot($ionicHistory.currentView().historyId)
        // $window.history.go(-2)
      })
    })
  }
})

