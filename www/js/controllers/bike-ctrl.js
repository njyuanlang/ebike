controllers

.controller('BikeCtrl', function($scope, $state, Bike, $rootScope, $ionicLoading, MyPreferences, $translate) {

  $rootScope.registering = $state.params.bikeId && $state.params.bikeId === 'create';

  var translations = {
    REGISTER_BIKE_FAILURE: ''
  };
  $translate(Object.keys(translations)).then(function (result) {
    translations = result;
  });

  $scope.register = function () {
    Bike.create($scope.registerBike, function (result) {
      $rootScope.registering = false;
      $rootScope.currentBike = result;
      MyPreferences.save();
      $state.go('tab.home');
    }, function (reason) {
      console.log(JSON.stringify(reason));
      $ionicLoading.show({
        template: translations.REGISTER_BIKE_FAILURE+":"+reason.data.error.message,
        duration: 2000
      });
    });
  };

  $scope.save = function () {
    Bike.upsert($rootScope.currentBike);
    MyPreferences.save();
  }
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
      order: "created ASC",
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
      wheeldiameter: '16',
      voltage: '60',
      current: '20',
      "name": brand.name
    }

    $state.go('bike-register', {bikeId: 'create'})
  }
})

.controller('WheelDiametersCtrl', function($scope, $state, Bike, MyPreferences) {
  $scope.entities = ['2~4', '4~6', '6~8', '10', '12', '14', '16', '18', '20', '22', '24', '26'];

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
  $scope.entities = ['18~24', '36', '48', '60', '72']

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
  $scope.entities = ['8~10', '12', '20', '30', '36']

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

.controller('BikesAddCtrl', function($scope, $state, $timeout, $ionicLoading,
   Bike, $ionicPopup, $rootScope, $window, $ionicScrollDelegate, PtrService,
   BLEDevice, MyPreferences, $translate, $ionicModal) {

  var devices = [];

  var translations = {
    CANCEL: '',
    UNNAMED: '',
    BIND_BIKE_SUCCESS: '',
    REGISTER_BIKE_FAILURE: "",
    BIND_BIKE_SUCCESS: "",
    BIND_BIKE_FAILURE: "",
    BINDING_TIPS: "",
    INPUT_BIND_PASSWORD: "",
    CONFIRM: ''
  };
  $translate(Object.keys(translations)).then(function (result) {
    translations = result;
  });

  function scanSuccessCb(result) {
    if(result) {
      if(!result.name || result.name == '' || result.name == '\u0004') {
        result.name = translations.UNNAMED;
      }
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
    var device = new BLEDevice(bike)
    device.connect()
    .then(function (result) {
      return device.pair(bike.password)
    })
    .then(function (result) {
      device.disconnect();
      $scope.closeModal();
      $scope.$ionicGoBack();
      $ionicLoading.show({
        template: '<i class="icon ion-ios-checkmark-outline padding"></i>'+translations.BIND_BIKE_SUCCESS,
        duration: 2000
      })
      $rootScope.device = device;
      $rootScope.currentBike = bike;
      MyPreferences.save();
      device.disconnect().then(function () {
        $state.go('tab.home');
      });
      Bike.upsert(bike);
    }, function (reason) {
      console.log(reason);
    })
    .catch(function (error) {
      device.disconnect();
      $ionicLoading.show({
        template: '<i class="icon ion-ios-close-outline padding"></i>'+translations.BIND_BIKE_FAILURE+':'+error,
        duration: 5000
      })
    })
  }

  $ionicModal.fromTemplateUrl('templates/authorize-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  $scope.$on('modal.hidden', function() {
    if($scope.tryIntervalID) {
      clearInterval($scope.tryIntervalID);
      $scope.tryIntervalID = null;
    }
  });
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

  $scope.selectEntity = function (item) {
    $scope.bike = angular.copy($scope.currentBike);
    $scope.bike.localId = item.id
    $scope.bike.name = item.name
    var password = Date.now()%1000000+'';
    for (var i = 0; i < 6-password.length; i++) {
      password += '0';
    }
    $scope.bike.password = password;
    if($scope.bike.password.length)
    console.log('PASSWORD:'+$scope.bike.password);

    $scope.modal.show();
    $scope.tryIntervalID = setInterval(function () {
      tryConnect($scope.bike);
    }, 2000);
  }

  $scope.goHome = function () {
    // $scope.modal.show();
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
