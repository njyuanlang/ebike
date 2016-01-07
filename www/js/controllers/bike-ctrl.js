controllers

.controller('BikeCtrl', function($scope, $state, Bike, $rootScope, $ionicLoading, MyPreferences) {
  
  $rootScope.registering = $state.params.bikeId && $state.params.bikeId === 'create';

  $scope.register = function () {
    Bike.create($scope.registerBike, function (result) {
      $rootScope.registering = false;
      $rootScope.currentBike = result;
      MyPreferences.save();
      $state.go('tab.home');   
    }, function (reason) {
      console.log(JSON.stringify(reason));
      $ionicLoading.show({
        template: "创建车辆失败："+reason.data.error.message,
        duration: 2000
      });
    });
  };

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
    $rootScope.registerBike = {
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

.controller('WheelDiametersCtrl', function($scope, $state, Bike, MyPreferences) {
  $scope.entities = [10, 12, 14, 16, 18, 20, 22, 24, 26]

  $scope.selectEntity = function (item) {
    if($scope.registering) {
      $scope.registerBike.wheeldiameter = item;
    } else {
      $scope.currentBike.wheeldiameter = item
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {wheeldiameter: $scope.currentBike.wheeldiameter});
      $scope.device.sendSpec();
      MyPreferences.save();
    }
    $scope.$ionicGoBack();
  }
})

.controller('VoltagesCtrl', function($scope, $state, Bike, MyPreferences) {
  $scope.entities = [36, 48, 60, 72]

  $scope.selectEntity = function (item) {
    if($scope.registering) {
      $scope.registerBike.voltage = item;
    } else {
      $scope.currentBike.voltage = item
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {voltage: $scope.currentBike.voltage})
      $scope.device.sendSpec();
      MyPreferences.save();
    }
    $scope.$ionicGoBack();
  }
})

.controller('CurrentsCtrl', function($scope, $state, Bike, MyPreferences) {
  $scope.entities = [12, 20, 30, 36]

  $scope.selectEntity = function (item) {
    if($scope.registering) {
      $scope.registerBike.current = item;
    } else {
      $scope.currentBike.current = item
      Bike.prototype$updateAttributes({ id: $scope.currentBike.id }, {current: $scope.currentBike.current})
      $scope.device.sendSpec();
      MyPreferences.save();
    }
    $scope.$ionicGoBack();
  }
})

.controller('BikesAddCtrl', function($scope, $state, $timeout, $ionicLoading, Bike, $ionicPopup, $rootScope, $window, $ionicScrollDelegate, PtrService, BLEDevice, MyPreferences) {
  
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
    
    $scope.device.disconnect()
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
          $timeout(scanErrorCb, 2000);
        })      
      } else {
        $timeout(scanErrorCb, 2000);
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
      $rootScope.device = device;
      $rootScope.currentBike.localId = bike.localId;
      $rootScope.currentBike = bike;
      MyPreferences.save();
      Bike.upsert(bike, function (result) {
        $state.go('tab.home');
      }, function (res) {
        $state.go('tab.home');
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
    $scope.bike = angular.copy($scope.currentBike);
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
    $state.go('tab.home');
  }
  
  $scope.$on("$ionicView.beforeLeave", function () {
    stopScan(true);
    $scope.device.autoconnect()
  })
  
  $scope.$on("$ionicView.enter", function () {
    $scope.entities = [];
    if($scope.online) PtrService.triggerPtr('mainScroll');
  })
    
})
