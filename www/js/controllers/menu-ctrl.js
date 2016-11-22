controllers

.controller('MenuCtrl', function($scope, $state, User) {
})

.controller('SettingCtrl', function ($scope, MyPreferences) {
  $scope.data = {buttonVibrate: $scope.buttonVibrate};
  $scope.save = function () {
    MyPreferences.save($scope.data);
  };
})

.controller('CustomCtrl', function ($scope, MyPreferences, $ionicPopup, $filter) {

  $scope.workmodes = [
    {title:"SMART_PARK", key: 0x4},
    {title:"SMART_PUSH", key: 0x5},
    {title:"SAVE_POWER", key: 0x1},
    {title:"CLIMB", key: 0x2},
    {title:"SPEED", key: 0x3}
  ];

  $scope.setKey = function (index) {
    if(!$scope.device) {
      return $ionicPopup.alert({
        title: $filter('translate')('TIPS'),
        template: '<div style="text-align: center">'+$filter('translate')('CUSTOM_KEY_NEED_CONNECTING')+'</div>'
      });
    }
    var mode = $scope.workmodes[index];
    $scope.device.statedefine(mode.key)
    .then(function () {
      $scope.index = index;
      MyPreferences.save();
    }, function (err) {
      $ionicPopup.alert({
        title: $filter('translate')('TIPS'),
        template: '<div style="text-align: center">'+($filter('translate')(err)||err)+'</div>'
      });
    });
  }

  $scope.index = 4;
  if($scope.device) {
    $scope.workmodes.some(function (mode, index) {
      if(mode.key === $scope.device.bike.customKey) {
        $scope.index = index;
        return true;
      } else {
        return false;
      }
    });
  }
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
    if($scope.device) {
      $scope.device.startReminder()
      $scope.entities = Object.keys($scope.device.reminder)
    } else {
      $scope.entities = [];
    }
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
