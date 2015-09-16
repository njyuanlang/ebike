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

.directive('showTabs', function($rootScope) {
  return {
    restrict: 'A',
    link: function($scope, $el) {
      $scope.$on("$ionicView.enter", function () {
        $rootScope.hideTabs = false;
      });
      $scope.$on("$ionicView.leave", function () {
        $rootScope.hideTabs = true;
      });
    }
  };
})