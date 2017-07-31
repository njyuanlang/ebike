controllers

.controller('BikeCtrl', function($scope, $state, Bike, $rootScope, $ionicLoading, MyPreferences, $translate, $ionicHistory) {

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
      // $scope.$ionicGoBack();
      $state.go('tab.home');
    }, function (reason) {
      var message = reason;
      if(reason&&reason.data&&reason.data.error) {
        message = reason.data.error.message;
      } else if(reason.status==-1) {
        message = 'no internet'
      }
      $ionicLoading.show({
        template: translations.REGISTER_BIKE_FAILURE+":"+message,
        duration: 2000
      });
    });
  };

  $scope.save = function () {
    Bike.upsert($rootScope.currentBike);
    MyPreferences.save();
    // $scope.$ionicGoBack();
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true,
      historyRoot: true
    });
    $state.go('tab.menu');
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
   BLEDevice, MyPreferences, $translate, $ionicModal, $ionicHistory, AnonymousUser, isSimpleVersion) {

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
    $scope.scanTimer = null;
    if($scope.scanTimer) $timeout.cancel($scope.scanTimer)
    $scope.entities = devices;
    $scope.$broadcast('scroll.refreshComplete');
  }

  function doScan() {
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
  }

  $scope.doScan = function () {
    if(!$scope.online) return;

    if (!$rootScope.device) {
      doScan();
    } else {
      $rootScope.device.disconnect().then(doScan);
    }
  }

  function tryConnect(device, newPassword) {
    device.connect(newPassword)
    .then(function (result) {
      return $scope.closeModal();
    })
    .then(function (result) {
      $scope.$ionicGoBack();
      $rootScope.device = device;
      $rootScope.currentBike = device.bike;
      MyPreferences.save();
      Bike.upsert(device.bike);
      return $ionicLoading.show({
        template: '<i class="icon ion-ios-checkmark-outline padding-right ion-2x"></i>'+translations.BIND_BIKE_SUCCESS,
        duration: 2000
      });
    })
    .then(function (result) {
      $rootScope.device.antiTheft(false);
      $state.go('tab.home');
      return result;
    })
    .catch(function (error) {
      if (!isSimpleVersion) return;
      $ionicLoading.show({
        template: '<i class="icon ion-ios-close-outline padding-right ion-2x"></i> '+error,
        duration: 3000
      });
    })
  }

  $ionicModal.fromTemplateUrl('templates/authorize-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.closeModal = function() {
    return $scope.modal.hide();
  };
  $scope.$on('modal.hidden', function() {
    if($scope.tryIntervalID) {
      clearInterval($scope.tryIntervalID);
      $scope.tryIntervalID = null;
      console.log('Stop tryIntervalID');
    }
  });
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

  $scope.selectEntity = function (item) {
    $scope.bike = angular.copy($scope.currentBike);
    $scope.bike.localId = item.id
    $scope.bike.name = item.name
    if(isSimpleVersion) {
      var passwordPopup = $ionicPopup.show({
        title: translations.INPUT_BIND_PASSWORD,
        templateUrl: 'templates/modifypassword-popup.html',
        scope: $scope,
        buttons: [
          {text: translations.CANCEL},
          {
            text: translations.CONFIRM,
            type: 'button-positive',
            onTap: function (e) {
              var ctrl = $scope.formController;
              if(ctrl && ctrl.$valid
                && ctrl.newPassword.$modelValue===ctrl.newPassword2.$modelValue) {
                return $scope.formController.newPassword.$modelValue;
              } else {
                e.preventDefault();
              }
            }
          }
        ]
      });

      passwordPopup.then(function(res) {
        if(res) {
          console.log('PASSWORD:'+$scope.bike.password);
          console.log('NEW_PASSWORD:'+res);
          var device;
          if($scope.bike.localId===$scope.currentBike.localId) {
            device = $rootScope.device;
            device.bike.password = $scope.bike.password;
          } else {
            device = new BLEDevice($scope.bike);
          }
          $ionicLoading.show({
            template: "<ion-spinner></ion-spinner>"
          })
          tryConnect(device, res);
        }
      });
    } else {
      var password = Date.now()%1000000+'';
      for (var i = 0; i < 6-password.length; i++) {
        password += '0';
      }
      $scope.bike.password = password;
      console.log('PASSWORD:'+$scope.bike.password);

      var device;
      if($scope.bike.localId===$scope.currentBike.localId) {
        device = $rootScope.device;
        device.bike.password = $scope.bike.password;
      } else {
        device = new BLEDevice($scope.bike);
      }
      $scope.modal.show();
      $scope.tryIntervalID = setInterval(function () {
        tryConnect(device);
      }, 2000);
    }
  }

  $scope.setFormController = function (formController) {
    $scope.formController = formController;
  }

  $scope.goHome = function () {
    // return $scope.selectEntity({})
    // $scope.modal.show();
    $ionicHistory.goBack();
    $ionicHistory.clearCache().then(function () {
      $state.go('tab.home');
    })
  }

  $scope.$on("$ionicView.beforeLeave", function () {
    stopScan(true);
  })

  $scope.$on("$ionicView.afterEnter", function () {

    if(!$scope.currentBike || !$scope.currentBike.id) {
      if($scope.tryRegisterBike) {
        $scope.$ionicGoBack();
      } else {
        $scope.tryRegisterBike = true;
        if($scope.isGlobalVersion) {
          return AnonymousUser.registerBike();
        } else {
          return $state.go('brands', {id:'create'});
        }
      }
    }

  })

  $scope.$on("$ionicView.enter", function () {
    $scope.entities = [];
    if($scope.online) PtrService.triggerPtr('mainScroll');
  })
})
