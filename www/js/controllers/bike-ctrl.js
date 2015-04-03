controllers

.controller('BikesCtrl', function($scope, $state, Bike, ActiveBLEDevice, currentBike, User) {
  User.getCurrent(function (user) {
    $scope.entities = Bike.find({filter:{where:{ownerId: user.id}}})
  })
  $scope.entity = ActiveBLEDevice.get().bike || {}

  $scope.activeEntityChange = function (item) {
    $scope.entity = item
    ActiveBLEDevice.set(item)
  }
  
  $scope.showDetail = function (item) {
    currentBike.set(item)
    $state.go('bike')
  }
  
})

.controller('BikeCtrl', function($scope, $state, Bike, $ionicHistory, $ionicLoading, currentBike) {
  $scope.entity = currentBike.get()
  
  $scope.delete = function () {
    Bike.deleteById({id:$scope.entity.id})
    $ionicLoading.show({
      template:'删除车辆',
      duration: 1000
    })
    currentBike.set(null)
    $ionicHistory.goBack()
  }
})

.controller('BrandsCtrl', function($scope, $state, Brand) {
  $scope.entities = Brand.find()
  
  $scope.selectEntity = function (item) {
    $state.go('models', {id:$state.params.id, brandId: item.id})
  }
})

.controller('ModelsCtrl', function($scope, $state, currentBike, Brand) {
  var brand = Brand.findById({id: $state.params.brandId}, function (result) {
    $scope.entities = result.models
  })

  $scope.selectEntity = function (item) {
    currentBike.set({brand: brand, model:item, workmode:0})
    $state.go('voltages', {id: $state.params.id})
  }
})

.controller('VoltagesCtrl', function($scope, $state, currentBike, $ionicHistory, Bike) {
  $scope.entities = [36, 48, 60, 72]
  $scope.entity = currentBike.get()

  $scope.selectEntity = function (item) {
    $scope.entity.voltage = item
    if($state.params.id === 'create') {
      $state.go('currents', {id: $state.params.id})
    } else {
      Bike.prototype$updateAttributes({ id: $scope.entity.id }, {voltage: $scope.entity.voltage})
      $ionicHistory.goBack()
    }
  }
})

.controller('CurrentsCtrl', function($scope, $state, currentBike, $ionicHistory, $window, Bike) {
  $scope.entities = [12, 20, 30, 36]
  $scope.entity = currentBike.get()

  $scope.selectEntity = function (item) {
    $scope.entity.current = item
    if($state.params.id === 'create') {
      if($window.ble) {
        $state.go('bikes-add')
      } else {
        $scope.entity.serialNumber = "0000"//Date.now()
        Bike.create($scope.entity, function () {
          
        }, function (res) {
          console.log(res)
        })
        $state.go('bikes')
      }
    } else {
      Bike.prototype$updateAttributes({ id: $scope.entity.id }, {current: $scope.entity.current})
      $ionicHistory.goBack()
    }
  }
})

.controller('BikesAddCtrl', function($scope, $state, BLEDevice, ActiveBLEDevice, $timeout, $ionicLoading, currentBike, $ionicHistory, Bike) {
  
  $scope.entities = []

  function scanSuccessCb(result) {
    $scope.entities.push(result)
    $scope.$apply()
  }
  
  function scanErrorCb(reason) {
    $scope.$broadcast('scroll.refreshComplete')
  }
  
  function doScan() {
    $scope.entities = []
    ble.scan([], 5, scanSuccessCb, scanErrorCb)
    $timeout(function () {
      $scope.$broadcast('scroll.refreshComplete')
    }, 5000)
  }
  $scope.doScan = doScan

  $scope.selectEntity = function (item) {
    var bike = currentBike.get()
    bike.localId = item.id
    bike.name = item.name
    var device = new BLEDevice(bike)
    device.connect()
    .then(function (result) {
      $ionicLoading.show({
        template: '连接到爱车'+item.name,
        duration: 2000
      })
      return device.readSerialNumber()
    }, function (reason) {
      $ionicLoading.show({
        template: "连接失败："+reason,
        duration: 2000
      })
    })
    .then(function (result) {
      Bike.create(bike, function (result) {
        ActiveBLEDevice.set(result)
        $ionicHistory.nextViewOptions({historyRoot:true})
        $state.go('home')
      }, function (res) {
        ActiveBLEDevice.set(bike)
        $ionicHistory.nextViewOptions({historyRoot:true})
        $state.go('home')
        $ionicLoading.show({
          template: "登记车辆失败："+res.data.error.message,
          duration: 2000
        })
      })
    }, function (reason) {
      $ionicLoading.show({
        template: "获取序列.号失败："+reason,
        duration: 2000
      })
    })
    
    $ionicLoading.show({
      template:'正在连接'+item.name+"...",
      duration: 3000
    })
  }
  
  $scope.init = function () {
    doScan()
  }
})
