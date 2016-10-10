controllers

.controller('MenuCtrl', function($scope, $state, User) {
})

.controller('SettingCtrl', function ($scope, MyPreferences) {
  $scope.data = {buttonVibrate: $scope.buttonVibrate};
  $scope.save = function () {
    MyPreferences.save($scope.data);
  };
})

.controller('CustomCtrl', function ($scope, MyPreferences, $ionicPopup) {
  $scope.workmodes = [
    {title:"智能泊车", key: 0x4},
    {title:"智能推行", key: 0x5},
    {title:"省电", key: 0x1},
    {title:"爬坡", key: 0x2},
    {title:"超速", key: 0x3}
  ];

  $scope.setKey = function (index) {
    var mode = $scope.workmodes[index];
    $scope.device.statedefine(mode.key)
    .then(function () {
      $scope.index = index;
      MyPreferences.save();
    }, function (err) {
      $ionicPopup.alert({
        title: '提示',
        template: err
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
