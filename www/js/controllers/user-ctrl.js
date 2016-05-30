controllers

.controller('EntryCtrl', function($scope, $rootScope, $localstorage, $ionicPlatform, $state) {

  $scope.goTrial = function () {
    $rootScope.online = false
    $rootScope.currentBike = {
      brand: {name: '宝旭'},
      model:'演示型号',
      workmode:0,
      wheeldiameter: 12,
      voltage: 48,
      current: 20,
      "name": "宝旭牌电动车"
    }
    $state.go('tab.home');
  }

  $scope.init = function () {
    if($localstorage.get('$EBIKE$IsNewbie', "YES") === "YES") {
      $localstorage.set('$EBIKE$IsNewbie', "NO")
      $state.go('intro')
    }
  }

  $scope.$on("$ionicView.enter", function () {
    $scope.deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(function () {
      // prevent from go back previous view
      ionic.Platform.exitApp();
    }, 101)
  })

  $scope.$on("$ionicView.leave", function () {
    if($scope.deregisterBackButtonAction) $scope.deregisterBackButtonAction();
  })

})

.controller('LoginCtrl', function($scope, $rootScope, $state, User, $ionicLoading, $filter, $localstorage, $cordovaNetwork, $ionicHistory, $timeout) {

  $scope.entity = {realm: 'client'}
  var lastLoginData = $localstorage.getObject('$$LastLoginData$$')
  for(key in lastLoginData) {
    $scope.entity[key] = lastLoginData[key]
  }

  $scope.tryLogin = function () {
    if(navigator.connection && $cordovaNetwork.isOffline()) {
      return $ionicLoading.show({
        template: '<i class="icon ion-minus-circled padding"></i>请连接到互联网',
        duration: 1000
      })
    }

    $rootScope.online = true

    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>登录中...'
    })

    console.debug(JSON.stringify($scope.entity));
    User.login($scope.entity, function (accessToken) {
      $timeout.cancel($scope.loginPromise)
      $ionicLoading.show({
        template: '<i class="icon ion-ios-checkmark-outline padding"></i>登录成功',
        duration: 1000
      })
      $localstorage.setObject('$$LastLoginData$$', $scope.entity)
      $rootScope.$broadcast('user.DidLogin');
      $state.go('tab.home');
    }, function (res) {
      $timeout.cancel($scope.loginPromise)
      var option = {
        template: '<i class="icon ion-ios-close-outline padding"></i>',
        duration: 2000
      }
      console.trace(JSON.stringify(arguments));
      option.template += $filter('loginErrorPrompt')(res.data && res.data.error.message)
      $ionicLoading.show(option)
    })

    $scope.loginPromise = $timeout(function () {
      $ionicLoading.show({
        template: '<i class="icon ion-ios-close-outline padding"></i>无法连接到服务器',
        duration: 2000
      })
    }, 10000)
  }

  $scope.goRegister = function (reset) {
    $state.go('register', {reset:reset})
  }

})

.controller('RegisterCtrl', function($scope, $state, $interval, $ionicLoading,
  User, $localstorage, Authmessage, $filter, $ionicHistory, $rootScope,
  $ionicNavBarDelegate, $translate) {

  var translations = {
    GET_AUTH_CODE: '',
    ELAPSE_SUFFIX: '',
    RESET_PASSWORD: '',
    REGISTER: '',
    REGISTERING: '',
    REGISTER_SUCCESS: ''
  };
  $scope.entity = {realm: "client"}
  $scope.$on("$ionicView.enter", function (event) {
    $scope.isReset = $state.params.reset == '1';
    $translate(Object.keys(translations)).then(function (result) {
      translations = result;
      $scope.validprompt = result.GET_AUTH_CODE;
      $scope.title = $scope.isReset?result.RESET_PASSWORD:result.REGISTER;
    });
    $ionicNavBarDelegate.showBar(true);
  });

  $scope.getAuthcode = function () {
    if($scope.disableValidcode) return
    $scope.disableValidcode = true
    $scope.elapse = 60
    $scope.promise = $interval(function () {
      if(--$scope.elapse === 0) {
        $interval.cancel($scope.promise)
        $scope.disableValidcode = false
        $scope.validprompt = translations.GET_AUTH_CODE;
      } else {
        $scope.validprompt = $scope.elapse+translations.ELAPSE_SUFFIX;
      }
    }, 1000)

    Authmessage.create({phone: $scope.entity.username})
  }

  $scope.tryRegister = function () {
    var entity = $scope.entity
    entity.email = entity.username+"@example.com"

    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>'+translations.REGISTERING
    })

    User.create(entity, function (user) {
      User.login(entity, function (accessToken) {
        $ionicLoading.show({
          template: '<i class="icon ion-ios-checkmark-outline padding"></i>'+translations.REGISTER_SUCCESS,
          duration: 1000
        })
        $localstorage.setObject('$$LastLoginData$$', {username: entity.username, password: entity.password})
        $rootScope.$broadcast('user.DidLogin');
        $state.go('provinces')
      })
    }, function (res) {
      var option = {
        template: '<i class="icon ion-ios-close-outline padding"></i>',
        duration: 2000
      }
      option.template += $filter('registerErrorPrompt')(res.data.error.message)
      $ionicLoading.show(option)
    })
  }

  $scope.tryResetPassword = function () {
    var entity = $scope.entity
    entity.email = entity.username+"@example.com"

    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>正在重置账户密码...'
    })

    User.resetPassword(entity, function (user) {
      $ionicLoading.show({
        template: '<i class="icon ion-ios-checkmark-outline padding"></i>重置密码成功',
        duration: 1000
      })
      $ionicHistory.goBack()
    }, function (res) {
      var option = {
        template: '<i class="icon ion-ios-close-outline padding"></i>',
        duration: 2000
      }
      option.template += $filter('registerErrorPrompt')(res.data.error.message)
      $ionicLoading.show(option)
    })
  }
})

.controller('AccountCtrl', function($scope, $state, User, $localstorage, $ionicHistory, $ionicPopup, $cordovaCamera, $jrCrop, $cordovaFile, $cordovaFileTransfer, Upload, RemoteStorage, $http, $rootScope, LoopBackAuth, $ionicActionSheet) {

  $scope.entity = User.getCurrent()

  $scope.logout = function () {
    if($rootScope.online) {
      if($scope.device) $scope.device.disconnect();
      User.logout().$promise
        .then(function () {
          console.debug('Success Logout');
        }, function (reason) {
          console.debug('Logout Failure for '+reason.data.error.message);
        });
        LoopBackAuth.clearUser();
        LoopBackAuth.clearStorage();
    } else {
      console.debug('logout Trial');
      $rootScope.online = true;
    }
    $state.go('entry');
  }

  var uploadAvatar = function () {
    var url = RemoteStorage.getUploadURL('uploads', $scope.entity.id)
    // var fd = new FormData();
    // fd.append('file', $scope.avatar, 'avatar.png');
    // $http.post(url, fd, {
    //   transformRequest: angular.identity,
    //   headers: {'Content-Type': undefined}
    // })
    // .success(function(){
    //   console.debug('SUCCESS')
    // })
    // .error(function(){
    //   console.debug('FAILED')
    // });
    // Upload.upload({container: $scope.entity.id}, $scope.avatar)
    // .$promise.then(function (result) {
    //   console.debug('Transfer SUCCESS: ', JSON.stringify(result))
    // }, function (err) {
    //   console.debug(err.message)
    // }, function (progress) {
    //
    // })


    var targetPath = cordova.file.dataDirectory + "avatar.png";
    var options = {
      mimeType: "image/png",
      fileName: "avatar.png"
    }

    $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {
      console.debug('Transfer SUCCESS: ', JSON.stringify(result))
    }, function (err) {
      console.debug(err.message)
    }, function (progress) {
      // console.debug(progress)
    })
  }

  var getPicture = function (index) {
    var options = {sourceType: Camera.PictureSourceType.PHOTOLIBRARY}
    if(index === 0) {
      options = {
        sourceType: Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.PNG,
        targetWidth: 400,
        targetHeight: 400,
        correctOrientation: true,
        saveToPhotoAlbum: false
      }
    }

    $cordovaCamera.getPicture(options).then(function(imageURI) {
      return $jrCrop.crop({
        url: imageURI,
        width: 300,
        height: 300,
        cancelText: "取消",
        chooseText: "选择"
      })
    }, function(err) {
      console.debug("getPicture ERROR: ", err.message)
    })
    .then(function (canvas) {
      $rootScope.avatar = canvas.toDataURL()
      var base64Data = $scope.avatar
      return $cordovaFile.writeFile(cordova.file.dataDirectory, "avatar.png", base64Data, true)
    }, function (err) {
      console.debug('Crop Error:', err)
    })
    .then(function (evt) {
      return Upload.getContainer({container: $scope.entity.id}).$promise
    }, function (err) {
      console.debug('Save avatar to local error:', JSON.stringify(err))
    })
    .then(function (container) {
      return container
    }, function (err) {
      return Upload.createContainer({name: $scope.entity.id}).$promise
    })
    .then(function (container) {
      uploadAvatar()
    }, function (err) {
      console.debug("Create/GET Container ERROR:", JSON.stringify(err))
    })

    return true;
  }

  $scope.changeAvatar = function () {
    $ionicActionSheet.show({
      buttons: [
        {text: '拍照'},
        {text: '从手机相册选择'}
      ],
      cancelText: '取消',
      buttonClicked: getPicture
    })
  }

  $scope.changeName = function () {
    $ionicPopup.prompt({
      title: '更改真实姓名',
      template: '请输入你的真实姓名,以便厂家能更好的服务您！',
      inputPlaceholder: ''
     }).then(function(res) {
       if(res && res !== '') {
         $scope.entity.name = res
         User.prototype$updateAttributes({id: $scope.entity.id}, {name: res})
       }
     });
  }

})

.controller('ProvincesCtrl', function ($scope, $state, ChinaRegion, $ionicNavBarDelegate, User, $ionicLoading) {
  $scope.entities = ChinaRegion.provinces
  $scope.goCities = function (item) {
    $state.go('cities', {province: JSON.stringify(item)})
  };
  $scope.$on("$ionicView.enter", function (event) {
    $scope.getLocalCity();
    $ionicNavBarDelegate.title('选择地区');
    $ionicNavBarDelegate.showBar(true);
    $ionicNavBarDelegate.showBackButton(true);
  });

  $scope.getLocalCity = function () {
    $scope.locating = true;
    $scope.currentCity = "正在定位..."
    AMap.service(["AMap.CitySearch"], function() {
      var citysearch = new AMap.CitySearch();
      citysearch.getLocalCity(function(status, result) {
        if (status === 'complete' && result.info === 'OK') {
          if (result && result.city && result.bounds) {
            $scope.currentCity = result.city;
          }
        } else {
          $scope.currentCity = result.info;
        }
        $scope.locating = false;
        $scope.$apply();
      });
    });
  };

  $scope.selectCurrentCity = function () {
    AMap.service(["AMap.Geocoder"], function () {
      var geocoder = new AMap.Geocoder({city: $scope.currentCity});
      geocoder.getLocation($scope.currentCity, function (status, result) {
        if(status === 'complete' && result.info === 'OK') {
          User.prototype$updateAttributes({id: $scope.currentUser.id}, {region: {
            province: result.geocodes[0].addressComponent.province,
            city: $scope.currentCity
          }});
          $state.go('tab.account');
        } else {
          $ionicLoading.show({
            template: '<i class="icon ion-minus-circled padding"></i>选择城市失败：'+result.info,
            duration: 2000
          });
        }
        console.debug(arguments);
      });
    })
  };
})

.controller('CitiesCtrl', function ($scope, $state, ChinaRegion, User, $rootScope, $window) {
  var province = JSON.parse($state.params.province)
  $scope.entities = province.sub

  $scope.selectEntity = function (item) {
    User.getCurrent(function (user) {
      user.region = {
        province: province.name,
        city: item.name
      }
      User.prototype$updateAttributes({ id: user.id }, { region: user.region}, function () {
      })
    });
    $state.go('tab.account');
  }

})
