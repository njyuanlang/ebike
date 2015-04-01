controllers

.controller('BikesCtrl', function($scope, $state, BikeService) {
  
  $scope.entities = BikeService.bikes

  $scope.activeEntityChange = function (item) {
    $scope.entity = item
    BikeService.setActive(item)
  }
  
  $scope.showDetail = function (item) {
    $state.go('bike', {bikeId:item.id})
  }
  
  $scope.activeEntityChange($scope.entities[0])
})

.controller('BikeCtrl', function($scope, $state, BikeService, $ionicHistory, $ionicLoading) {
  $scope.entity = BikeService.getBike($state.params.bikeId)
  
  $scope.delete = function () {
    BikeService.deleteBike($scope.entity.id)
    $ionicLoading.show({
      template:'删除车辆',
      duration: 1000
    })
    $ionicHistory.goBack()
  }
})

.controller('BrandsCtrl', function($scope, $state, Brand) {
  $scope.entities = Brand.find()
  
  $scope.selectEntity = function (item) {
    $state.go('models', {id:$state.params.id, brandId: item.id})
  }
})

.controller('ModelsCtrl', function($scope, $state, BikeService, Brand) {
  var brand = Brand.findById({id: $state.params.brandId}, function (result) {
    $scope.entities = result.models
  })

  $scope.selectEntity = function (item) {
    BikeService.currentBike = {brand: brand, model:item, id: uuid.v4(), workmode:0}
    $state.go('voltages', {id: $state.params.id})
  }
})

.controller('VoltagesCtrl', function($scope, $state, BikeService, $ionicHistory) {
  $scope.entities = [36, 48, 60, 72]

  $scope.selectEntity = function (item) {
    if($state.params.id === 'create') {
      BikeService.currentBike.voltage = item
      $state.go('currents', {id: $state.params.id})
    } else {
      var bike = BikeService.getBike($state.params.id)
      bike.voltage = item
      $ionicHistory.goBack()
    }
  }
})

.controller('CurrentsCtrl', function($scope, $state, BikeService, $ionicHistory, $window) {
  $scope.entities = [12, 20, 30, 36]

  $scope.selectEntity = function (item) {
    if($state.params.id === 'create') {
      var bike = BikeService.currentBike
      bike.current = item
      BikeService.bikes.push(bike)
      if($window.ble) {
        $state.go('bikes-add', {id: $state.params.id})
      } else {
        $state.go('bikes')
      }
    } else {
      var bike = BikeService.getBike($state.params.id)
      bike.current = item
      $ionicHistory.goBack()
    }
  }
})

.controller('BikesAddCtrl', function($scope, $state, BLEDevice, ActiveBLEDevice, $timeout, $ionicLoading, BikeService, $ionicHistory) {
  
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
    var bike = BikeService.currentBike
    bike.localId = item.id
    bike.name = item.name
    var device = new BLEDevice(bike)
    device.connect()
    .then(function (result) {
      $ionicLoading.show({
        template: '连接到爱车'+item.name,
        duration: 2000
      })
      ActiveBLEDevice.set(bike)
      $ionicHistory.nextViewOptions({historyRoot:true})
      $state.go('home')
    }, function (reason) {
      $ionicLoading.show({
        template: "连接失败："+reason,
        duration: 2000
      })
      // alert(reason)
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
