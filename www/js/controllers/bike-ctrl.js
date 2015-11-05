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
    $state.go('tab.bike')
  }
  
})

.controller('BikeCtrl', function($scope, $state, Bike, $rootScope, ActiveBLEDevice, $ionicLoading) {
  
  $scope.registering = $state.params.bikeId && $state.params.bikeId === 'create';

  $scope.register = function () {
    Bike.create($scope.currentBike, function (result) {
      $scope.currentBike.id = result.id;
      $rootScope.$broadcast('go.home', {bike: $scope.currentBike})
    }, function (reason) {
      console.log(JSON.stringify(reason));
      $ionicLoading.show({
        template: "创建车辆失败："+reason.data.error.message,
        duration: 2000
      });
    });
  };
  
  $scope.$watch('currentBike.safe', function (newValue, oldValue) {
    if(newValue !== oldValue) {
      if($scope.correctSafeMode) {
        $scope.correctSafeMode = false;
        return;
      }
      
      ActiveBLEDevice.get().safeMode(newValue)
      .then(function (result) {
        console.debug('Success Set SafeMode:'+newValue);
      }, function (reason) {
        $scope.correctSafeMode = true;
        $scope.currentBike.safe = oldValue;
        $ionicLoading.show({
          template: '<i class="icon ion-ios7-information-outline padding"></i>'+reason,
          duration: 2000
        });
      });
    }
  });

  $scope.$watch('currentBike.antiTheft', function (newValue, oldValue) {
    if(newValue !== oldValue) {
      ActiveBLEDevice.get().antiTheft(newValue)
      .then(function (result) {
        console.debug('Success Set AntiTheft:'+newValue);
      }, function (reason) {
        $ionicLoading.show({
          template: '<i class="icon ion-ios7-information-outline padding"></i>'+reason,
          duration: 2000
        });
      });
    }
  });
})

.controller('BrandsCtrl', function($scope, $state, Brand) {
  $scope.entities = [];
  var pages = 0;
  var isMoreData = true;
  var loading = false;
  
  $scope.selectEntity = function (item) {
    $state.go('models', {brandId: item.id})
  }
  
  $scope.loadMoreData = function () {
    if(loading) return;
    loading = true;
    Brand.find({filter:{
      skip: pages*10,
      limit:10
    }}, function (results) {
      loading = false;
      pages++;
      isMoreData = results.length === 10;
      $scope.entities = $scope.entities.concat(results);
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  }
  
  $scope.$on('$ionicView.enter', function() {
    $scope.loadMoreData();
  });
  
  $scope.moreDataCanBeLoaded = function () {
    return isMoreData;
  }
})

.controller('ModelsCtrl', function($scope, $state, Brand, $rootScope, Bike) {
  var brand = Brand.findById({id: $state.params.brandId}, function (result) {
    $scope.entities = result.models
  })

  $scope.selectEntity = function (item) {
    $rootScope.currentBike = {
      brand: brand, 
      model:item, 
      workmode:0,
      wheeldiameter: 16,
      voltage: 48,
      current: 20,
      "name": brand.name+"牌电动车"
    }
    
    $state.go('bike-register', {bikeId: 'create'})
  }
})

.controller('WheelDiametersCtrl', function($scope, $state, $ionicHistory, Bike, ActiveBLEDevice) {
  $scope.entities = [12, 14, 16, 18, 20, 22, 24, 26]

  $scope.selectEntity = function (item) {
    $scope.currentBike.wheeldiameter = item
    if($state.params.id === 'create') {
      $state.go('voltages', {id: $state.params.id})
    } else {
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {wheeldiameter: $scope.currentBike.wheeldiameter});
      ActiveBLEDevice.get().sendSpec();
      $ionicHistory.goBack()
    }
  }
})

.controller('VoltagesCtrl', function($scope, $state, $ionicHistory, Bike, ActiveBLEDevice) {
  $scope.entities = [36, 48, 60, 72]

  $scope.selectEntity = function (item) {
    $scope.currentBike.voltage = item
    if($state.params.id === 'create') {
      $state.go('currents', {id: $state.params.id})
    } else {
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {voltage: $scope.currentBike.voltage})
      ActiveBLEDevice.get().sendSpec();
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
        $scope.currentBike.id = result.id;
        $state.go('bikes-add')
      }, function (res) {
        $rootScope.$broadcast('go.home', {bike: $scope.currentBike})
      })
    } else {
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {current: $scope.currentBike.current})
      ActiveBLEDevice.get().sendSpec();
      $ionicHistory.goBack()
    }
  }
})

.controller('BikesAddCtrl', function($scope, $state, ActiveBLEDevice, $timeout, $ionicLoading, Bike, $ionicPopup, $rootScope, $window, $ionicScrollDelegate, PtrService, BLEDevice) {
  
  var devices = [];

  function scanSuccessCb(result) {
    if(result && result.name && result.name != '') {
      var exist = devices.some(function (item) {
        return item.id === result.id;
      });
      if(!exist) {
        devices.push(result);
      }
    }
  }
  
  function scanErrorCb(reason) {
    $scope.$broadcast('scroll.refreshComplete')
  }
  
  function stopScan(isForce) {
    console.log('stopScan================');
    if(isForce || devices.length > 0) {
      $scope.scanTimer = null;
      $scope.entities = devices;
      $scope.$broadcast('scroll.refreshComplete');
    } else {
      doScan();
    }
  }

  function doScan() {
    if(!$scope.online) return;
    
    ActiveBLEDevice.get().disconnect()
    .then(function () {
      if($window.ble) {
        ble.isEnabled(function (result) {
          devices = []
          $scope.entities = []
          $scope.$apply()
          if($scope.scanTimer) $timeout.cancel($scope.scanTimer)
          $scope.scanTimer = $timeout(stopScan, 5000)
          ble.scan([], 5, scanSuccessCb, scanErrorCb)
        }, function (error) {
          $rootScope.$broadcast('bluetooth.disabled');
        })      
      }
    });
  }
  $scope.doScan = doScan

  function tryConnect(bike) {
    console.debug('===='+JSON.stringify(bike));
    var device = new BLEDevice(bike)
    device.connect().then(function (result) {
      return device.readSerialNumber()
    })
    .then(function (result) {
      return device.pair(bike.password)
    })
    .then(function (result) {
      return device.changePassword(bike.newpassword);
    })
    .then(function (result) {
      $scope.$ionicGoBack();
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-checkmark-outline padding"></i>绑定车辆成功',
        duration: 2000
      })
      delete bike.newpassword;
      delete bike.newpassword2;
      ActiveBLEDevice.set(device);
      Bike.upsert(bike, function (result) {
        $rootScope.$broadcast('go.home')
      }, function (res) {
        $rootScope.$broadcast('go.home')
      })
    })
    .catch(function (error) {
      device.disconnect();
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-close-outline padding"></i>绑定失败：'+error,
        duration: 5000
      })
    })
    
    $ionicLoading.show({
      template:'<i class="icon ion-loading-c ion-loading padding"></i>请稍后，正在连接'+bike.name+"...",
      duration: 30000
    })
  }
  
  $scope.selectEntity = function (item) {
    $scope.bike = angular.copy($scope.currentBike)
    $scope.bike.localId = item.id
    $scope.bike.name = item.name

    $ionicPopup.show({
      title: '输入车辆配对密码',
      templateUrl: 'pair-Popup.html',
      scope: $scope,
      buttons: [
        {text: '取消'},
        {
          text: '<b>确定</b>',
          type: 'button-positive',
          onTap: function (e) {
            if (!$scope.bike.password || $scope.bike.password.length !== 6) {
              e.preventDefault();
            } else if(!$scope.bike.newpassword || $scope.bike.newpassword.length !== 6) {
              e.preventDefault();
            } else if($scope.bike.newpassword != $scope.bike.newpassword2) {
              e.preventDefault();
            } else {
              return $scope.bike;
            }
          }
        }
      ]
    })
    .then(tryConnect);     
  }
    
  $scope.goHome = function () {
    $rootScope.$broadcast('go.home');
  }
  
  $scope.$on("$ionicView.leave", function () {
    stopScan(true);
    ActiveBLEDevice.get().autoconnect()
  })
  
  $scope.$on("$ionicView.enter", function () {
    $scope.entities = [];
    if($scope.online) PtrService.triggerPtr('mainScroll');
  })
    
})
