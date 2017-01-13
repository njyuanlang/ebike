controllers

.controller('CruiseCtrl', function($scope, $state, $ionicModal) {

  $scope.$on( 'realtime.update', function (event) {
    // if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
    //   $scope.device.setWorkmode(0)
    // }
    $scope.$apply()
  })

  $scope.$on( 'reminder.update', function (event, args) {
    $scope.reminder = args.reminder
    $scope.$apply()
  })

  $scope.$on('$ionicView.enter', function (event) {
    if(!$scope.online) return $scope.device.onConnected()
  })

  window.addEventListener("orientationchange", function() {
    $scope.promptRotate = Math.abs(window.orientation) !== 90
    if(!$scope.promptRoate && $scope.modal) {
      $scope.modal.hide()
    }
  }, false);

  var workmodes = [1, 0, 2, 15];
  $scope.switchWorkmode = function () {
    if($scope.device.bike.workmode === 9 ||
      $scope.workmodeIdx === -1) return;
    $scope.device.setWorkmode((workmodes[++$scope.workmodeIdx%4]));
  }

  $scope.init = function () {
    if(!$scope.online) return $scope.device.onConnected()

    $scope.promptRotate = Math.abs(window.orientation) !== 90
    // $scope.promptRotate = false;

    $scope.workmodeIdx = workmodes.indexOf($scope.device.bike.workmode);
  }

})
