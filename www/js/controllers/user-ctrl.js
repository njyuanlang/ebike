controllers

.controller('EntryCtrl', function($scope, $rootScope, $localstorage, $ionicPlatform) {

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
    $rootScope.$broadcast('go.home', {bike: $rootScope.currentBike})
  }
  
  $scope.init = function () {
    if($localstorage.get('$EBIKE$IsNewbie', "YES") === "YES") {
      $localstorage.set('$EBIKE$IsNewbie', "NO")
      $state.go('help')
    }
  }

  $scope.$on("$ionicView.enter", function () {
    $scope.deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(function () {
      // prevent from go back previous view
      ionic.Platform.exitApp();
    }, 101)
  })
  
  $scope.$on("$ionicView.leave", function () {
    $scope.deregisterBackButtonAction()
  })
  
})

.controller('LoginCtrl', function($scope, $rootScope, $state, User, $ionicLoading, $filter, $localstorage, $cordovaNetwork, $ionicHistory, $timeout, ActiveBLEDevice) {
  
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
    User.login($scope.entity, function (accessToken) {
      $timeout.cancel($scope.loginPromise)
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-checkmark-outline padding"></i>登录成功',
        duration: 1000
      })
      console.debug(JSON.stringify($scope.entity));
      $localstorage.setObject('$$LastLoginData$$', $scope.entity)
      $rootScope.$broadcast('user.DidLogin', {userId: accessToken.userId})
      $rootScope.$broadcast('go.home', {bike: ActiveBLEDevice.getBike()})
    }, function (res) {
      $timeout.cancel($scope.loginPromise)
      var option = {
        template: '<i class="icon ion-ios7-close-outline padding"></i>',
        duration: 2000
      }
      option.template += $filter('loginErrorPrompt')(res.data.error.message)
      $ionicLoading.show(option)      
    })
    
    $scope.loginPromise = $timeout(function () {
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-close-outline padding"></i>无法连接到服务器',
        duration: 2000
      })
    }, 10000)
  }

  $scope.goRegister = function (reset) {
    $state.go('register', {reset:reset})
  }
  
})

.controller('RegisterCtrl', function($scope, $state, $interval, $ionicLoading, User, $localstorage, Authmessage, $filter, $ionicHistory, $rootScope, $ionicNavBarDelegate) {
  
  $scope.entity = {realm: "client"}
  $scope.validprompt = "获取验证码"
  $scope.$on("$ionicView.enter", function (event) {
    $ionicNavBarDelegate.showBar(true);
    $ionicNavBarDelegate.title($state.params.reset?'重置密码':'注册');
    // $ionicNavBarDelegate.showBackButton(true);
  });
  
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

    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>正在注册新账户...'
    })

    User.create(entity, function (user) {
      User.login(entity, function (accessToken) {
        $ionicLoading.show({
          template: '<i class="icon ion-ios7-checkmark-outline padding"></i>注册账户成功',
          duration: 1000
        })
        $localstorage.setObject('$$LastLoginData$$', {username: entity.username, password: entity.password})
        $rootScope.$broadcast('user.DidLogin', {userId: accessToken.userId})
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
  
  $scope.tryResetPassword = function () {
    var entity = $scope.entity
    entity.email = entity.username+"@example.com"

    $ionicLoading.show({
      template: '<i class="icon ion-loading-c ion-loading padding"></i>正在重置账户密码...'
    })

    User.resetPassword(entity, function (user) {
      $ionicLoading.show({
        template: '<i class="icon ion-ios7-checkmark-outline padding"></i>重置密码成功',
        duration: 1000
      })
      $ionicHistory.goBack()
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

.controller('AccountCtrl', function($scope, $state, ActiveBLEDevice, User, $localstorage, $ionicHistory, $ionicPopup, $cordovaCamera, $jrCrop, $cordovaFile, $cordovaFileTransfer, Upload, RemoteStorage, $http, $rootScope, LoopBackAuth, $ionicActionSheet) {
  
  $scope.entity = User.getCurrent()

  $scope.logout = function () {
    if($rootScope.online) {
      var device = ActiveBLEDevice.get();
      if(device) device.disconnect();
      User.logout().$promise
        .then(function () {
          console.debug('Success Logout');
        }, function (reason) {
          console.debug('Logout Failure for '+reason);
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
    //   console.log('SUCCESS')
    // })
    // .error(function(){
    //   console.log('FAILED')
    // });
    // Upload.upload({container: $scope.entity.id}, $scope.avatar)
    // .$promise.then(function (result) {
    //   console.log('Transfer SUCCESS: ', JSON.stringify(result))
    // }, function (err) {
    //   console.log(err.message)
    // }, function (progress) {
    //
    // })

   
    var targetPath = cordova.file.dataDirectory + "avatar.png";
    var options = {
      mimeType: "image/png",
      fileName: "avatar.png"
    }

    $cordovaFileTransfer.upload(url, targetPath, options).then(function (result) {
      console.log('Transfer SUCCESS: ', JSON.stringify(result))
    }, function (err) {
      console.log(err.message)
    }, function (progress) {
      // console.log(progress)
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
      console.log("getPicture ERROR: ", err.message)
    })
    .then(function (canvas) {
      $rootScope.avatar = canvas.toDataURL()
      var base64Data = $scope.avatar
      return $cordovaFile.writeFile(cordova.file.dataDirectory, "avatar.png", base64Data, true)
    }, function (err) {
      console.log('Crop Error:', err)
    })
    .then(function (evt) {
      return Upload.getContainer({container: $scope.entity.id}).$promise
    }, function (err) {
      console.log('Save avatar to local error:', JSON.stringify(err))
    })
    .then(function (container) {
      return container
    }, function (err) {
      return Upload.createContainer({name: $scope.entity.id}).$promise
    })
    .then(function (container) {
      uploadAvatar()
    }, function (err) {
      console.log("Create/GET Container ERROR:", JSON.stringify(err))
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

.controller('ProvincesCtrl', function ($scope, $state, ChinaRegion, $ionicNavBarDelegate) {
  $scope.entities = ChinaRegion.provinces
  $scope.goCities = function (item) {
    $state.go('cities', {province: JSON.stringify(item)})
  }
  $scope.$on("$ionicView.enter", function (event) {
    $ionicNavBarDelegate.title('选择省份');
    $ionicNavBarDelegate.showBar(true);
    $ionicNavBarDelegate.showBackButton(true);
  });
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
        // if($window.ble) {
        //   $window.ble.isEnabled(function (result) {
        //     //bluetooth is enabled
        //   }, function (error) {
        //     $ionicPopup.alert({
        //       title: '打开蓝牙来允许“帮大师”连接到车辆',
        //       okText: '好'
        //     });
        //   })
        // }
      })
    });
    // $rootScope.$broadcast('go.home');
    $state.go('tab.account');
  }  
})

