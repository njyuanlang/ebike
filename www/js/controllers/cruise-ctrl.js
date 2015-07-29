controllers

.controller('CruiseCtrl', function($scope, $state, ActiveBLEDevice, $ionicModal) {
      
  $scope.$on( 'realtime.update', function (event) {
    if($scope.device.bike.workmode === 9 && $scope.device.realtime.power > 24) {
      $scope.device.setWorkmode(0)
    }
    $scope.$apply()
  })
  
  $scope.$on( 'reminder.update', function (event, args) {
    $scope.reminder = args.reminder
    $scope.$apply()
  })
  
  window.addEventListener("orientationchange", function() {
    $scope.promptRotate = Math.abs(window.orientation) !== 90
    if(!$scope.promptRoate && $scope.modal) {
      $scope.modal.hide()
    }
  }, false);

  $scope.switchWorkmode = function () {
    $scope.device.setWorkmode((++$scope.device.bike.workmode)%3)
  }
  
  $scope.init = function () {
    $scope.device = ActiveBLEDevice.get()
    
    $scope.promptRotate = Math.abs(window.orientation) !== 90
    // $scope.promptRotate = false
  }
  
})
