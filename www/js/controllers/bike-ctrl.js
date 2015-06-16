controllers

.controller('BikesCtrl', function($scope, $state, Bike, ActiveBLEDevice, User, $window) {
  User.getCurrent(function (user) {
    $scope.entities = Bike.find({filter:{where:{"owner.id":user.id}}})
  })
  $scope.entity = ActiveBLEDevice.get().bike || {}

  $scope.activeEntityChange = function (item) {
    ActiveBLEDevice.get().disconnect()
    $scope.entity = item
    $scope.currentBike = item
    if($window.ble) {
      $state.go('bikes-add')
    }
  }
  
  $scope.showDetail = function (item) {
    $scope.currentBike = item
    $state.go('bike')
  }
  
})

.controller('BikeCtrl', function($scope, $state, Bike, $ionicHistory) {
  $scope.switch = function () {
    $state.go('brands', {id: 'create'})
  }
})

.controller('BrandsCtrl', function($scope, $state, Brand) {
  $scope.entities = Brand.find()
  
  $scope.selectEntity = function (item) {
    $state.go('models', {id:$state.params.id, brandId: item.id})
  }
})

.controller('ModelsCtrl', function($scope, $state, Brand, $rootScope) {
  var brand = Brand.findById({id: $state.params.brandId}, function (result) {
    $scope.entities = result.models
  })

  $scope.selectEntity = function (item) {
    $rootScope.currentBike = {brand: brand, model:item, workmode:0, "name": brand.name+"牌电动车"}
    $state.go('wheeldiameters', {id: $state.params.id})
  }
})

.controller('WheelDiametersCtrl', function($scope, $state, $ionicHistory, Bike) {
  $scope.entities = [12, 14, 16, 18, 20, 22, 24, 26]

  $scope.selectEntity = function (item) {
    $scope.currentBike.wheeldiameter = item
    if($state.params.id === 'create') {
      $state.go('voltages', {id: $state.params.id})
    } else {
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {wheeldiameter: $scope.currentBike.wheeldiameter})
      $ionicHistory.goBack()
    }
  }
})

.controller('VoltagesCtrl', function($scope, $state, $ionicHistory, Bike) {
  $scope.entities = [36, 48, 60, 72]

  $scope.selectEntity = function (item) {
    $scope.currentBike.voltage = item
    if($state.params.id === 'create') {
      $state.go('currents', {id: $state.params.id})
    } else {
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {voltage: $scope.currentBike.voltage})
      $ionicHistory.goBack()
    }
  }
})

.controller('CurrentsCtrl', function($scope, $state, $ionicHistory, $window, Bike, ActiveBLEDevice, $rootScope) {
  $scope.entities = [12, 20, 30, 36]

  $scope.selectEntity = function (item) {
    $scope.currentBike.current = item
    if($state.params.id === 'create') {
      Bike.create($scope.currentBike, function (result) {
        ActiveBLEDevice.set(result)
        $state.go('bikes-add')
      }, function (res) {
        $rootScope.$broadcast('go.home', {bike: $scope.currentBike})
      })
    } else {
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {current: $scope.currentBike.current})
      $ionicHistory.goBack()
    }
  }
})

.controller('BikesAddCtrl', function($scope, $state, ActiveBLEDevice, $timeout, $ionicLoading, $ionicHistory, Bike, $ionicPopup, $rootScope, $window) {
  
  $scope.entities = []

  function scanSuccessCb(result) {
    if(result && result.name && result.name != '') {
      var exist = $scope.entities.some(function (item) {
        return item.id === result.id
      })
      if(!exist) {
        $scope.entities.push(result)
        $scope.$apply()
      }
    }
  }
  
  function scanErrorCb(reason) {
    $scope.$broadcast('scroll.refreshComplete')
  }
  
  function doScan() {
    $scope.entities = []
    ActiveBLEDevice.get().disconnect()
    if($window.ble) ble.scan([], 5, scanSuccessCb, scanErrorCb)
    $timeout(function () {
      $scope.$broadcast('scroll.refreshComplete')
    }, 5000)
  }
  $scope.doScan = doScan

  function tryConnect(bike) {
    ActiveBLEDevice.set(bike)
    var device = ActiveBLEDevice.get()
    device.connect().then(function (result) {
      return device.readSerialNumber()
    }, function (reason) {
      $ionicLoading.show({
        template: "连接失败："+reason,
        duration: 2000
      })
    })
    .then(function (result) {
      return device.pair(bike.password)
    }, function (reason) {
      $ionicLoading.show({
        template: "获取序列号失败："+reason,
        duration: 2000
      })
    })
    .then(function (result) {
      $ionicLoading.show({
        template: '连接到爱车'+bike.name,
        duration: 2000
      })
      Bike.upsert(bike, function (result) {
        $rootScope.$broadcast('go.home')
      }, function (res) {
        $rootScope.$broadcast('go.home')
      })
    }, function (reason) {
      device.disconnect()
      $ionicLoading.show({
        template: "配对失败："+reason,
        duration: 2000
      })
    })
    
    $ionicLoading.show({
      template:'正在连接'+bike.name+"...",
      duration: 10000
    })
  }
  
  $scope.selectEntity = function (item) {
    var bike = $scope.currentBike
    bike.localId = item.id
    bike.name = item.name

    $ionicPopup.prompt({
      title: '车辆配对',
      template: '请输入车辆的配对密码，以绑定手机',
      inputPlaceholder: ''
     }).then(function(res) {
       if(res && res !== '') {
         bike.password = res
         tryConnect(bike)
       }
     });
     
  }
  
  $scope.goHome = function () {
    $ionicHistory.goToHistoryRoot($ionicHistory.currentView().historyId)
  }
  
  $scope.$on("$ionicView.leave", function () {
    ActiveBLEDevice.get().autoconnect()
  })
  
  $scope.init = function () {
    doScan()
  }
})
