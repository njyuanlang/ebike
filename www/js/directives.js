'use strict'

angular.module('ebike.directives',[])

.directive('hideTabs', function($rootScope) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $scope.$on("$ionicView.beforeEnter", function () {
        $rootScope.hideTabs = true;
      });
      $scope.$on("$ionicView.beforLeave", function () {
        $rootScope.hideTabs = false;
      });
    }
  };
})

.directive('showTabs', function($rootScope, $ionicPlatform) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $scope.$on("$ionicView.enter", function () {
        $rootScope.hideTabs = false;
        if(!$rootScope.deregisterBackButtonAction) {
          $rootScope.deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(function () {
            if($rootScope.device) {
              $rootScope.device.disconnect().then(function () {
                ionic.Platform.exitApp();
              }, function () {
                ionic.Platform.exitApp();
              });
            } else {
              ionic.Platform.exitApp();
            }
          }, 100);
        }
      });
      $scope.$on("$ionicView.leave", function () {
        $rootScope.hideTabs = true;
        if($rootScope.deregisterBackButtonAction) {
          $rootScope.deregisterBackButtonAction();
          $rootScope.deregisterBackButtonAction = null;
        }
      });
    }
  };
})

.directive('pushvibrate', function($rootScope, $cordovaVibration) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $el.bind('click', function () {
        if($rootScope.buttonVibrate && $rootScope.online) {
          $cordovaVibration.vibrate(50);
        }
      });
    }
  };
})
