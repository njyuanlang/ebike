controllers

.controller('MenuCtrl', function($scope, $state, User) {

  // $scope.entity = User.getCurrent()

})

.controller('SettingCtrl', function ($scope, MyPreferences) {
  $scope.data = {buttonVibrate: $scope.buttonVibrate};
  $scope.save = function () {
    MyPreferences.save($scope.data);
  };
})

.controller('MessagesCtrl', function($scope, $state, $rootScope, $translate) {

  var translations = {
    OPEN_WITH_KEY: '',
    REQUIRE_CONNECT_BIKE_TIPS: '',
    CONNECT_BIKE_FAILURE: ''
  };
  $translate(Object.keys(translations)).then(function (result) {
    translations = result;
  });

  $scope.setting = false;
  $scope.rightButtonTitle = translations.SETTING;

  $scope.doSetting = function () {
    if($scope.setting) {
      $scope.bike.save()
      $scope.rightButtonTitle = translations.SETTING;
    } else {
      $scope.rightButtonTitle = translations.SAVE;
    }
    $scope.setting = !$scope.setting;
  }

  $scope.init = function () {
    $scope.device.startReminder()
    $scope.entities = Object.keys($scope.device.reminder)
  }

})

.controller('MessagesDetailCtrl', function($scope, $state, $stateParams) {
  $scope.type = $stateParams.type
  $scope.init = function () {
    $scope.device.fetchReminders($scope.type).then(function (result) {
      $scope.entities = result
    })
  }
})
