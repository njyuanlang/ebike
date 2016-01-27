controllers

.controller('HomeCtrl', function($scope, $state, $ionicLoading, User, $localstorage) {
    
  $scope.$on( 'realtime.update', function (event) {
    if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
      $scope.device.setWorkmode(0)
    }
    $scope.$apply()
  })
  
  $scope.$on('$ionicView.enter', function (event) {
    $scope.showPrompt = false;
    if(!$scope.online) return $scope.device.onConnected();
    if(!$scope.device || $scope.device.status === 'disconnected') {
      var promptCount = $localstorage.get('$EBIKE$PromptCount', 0);
      if( promptCount < 5) {
        $scope.showPrompt = true;
        $localstorage.set('$EBIKE$PromptCount', ++promptCount);
      }
    }
  })

  $scope.goTest = function () {
    if($scope.device.status === 'connected') {
      $state.go('tab.test')
    } else {
      $ionicLoading.show({
        template: '<i class="icon ion-ios-information-outline padding"></i>请连接车辆',
        duration: 2000
      })
    }
  }
  
  $scope.endure = function () {
    $scope.device.setWorkmode(9)
  }
    
  var reconnectDevice = function () {
    $scope.showPrompt = false;
    if(!$scope.online) return $scope.device.onConnected()

    if($scope.currentBike && $scope.currentBike.id) {
      $scope.device.autoconnect().then(function (result) {

      }, function (reason) {
        if(reason === 'no localId') {
          $state.go('tab.home-bind')
        } else if(reason === 'connecting') {
          console.debug('prevent from contiuning autoconnect');
        } else {
          $ionicLoading.show({
            template: '<i class="icon ion-ios-close-outline padding"></i>连接车辆失败',
            duration: 2000
          })
        }
      })
    } else {
      $state.go('brands', {id:'create'});
    }
  }
  
  $scope.reconnectDevice = reconnectDevice
  
  $scope.$on('home.reconnect', reconnectDevice);
    
  $scope.init = function () {
  }
})
