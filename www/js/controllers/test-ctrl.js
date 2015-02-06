controllers

.controller('TestCtrl', function($scope, $state, $interval, ActiveBike) {

  $scope.testState = "系统正在扫描中"
  
  $scope.testScore = 75
  
  $scope.entities = [
    {"name": "转把", progress:0, state: "testing"},
    {"name": "电机", progress:0, state: "testing"},
    {"name": "刹车", progress:0, state: "testing"},
    {"name": "控制器", progress:0, state: "testing"}
  ]
  
  function test() {
    $scope.entities.forEach(function (item) {
      item.progress = 0
    })
    
    $scope.activeEntityIndex = 0
    $scope.testPromise = $interval(function () {
      $scope.entities[$scope.activeEntityIndex].progress += 1
      if($scope.entities[$scope.activeEntityIndex].progress >= 90) {
        $scope.activeEntityIndex++
        if($scope.activeEntityIndex === $scope.entities.length) {
          $interval.cancel($scope.testPromise)
        }
      }
    }, 50)
    
    ActiveBike.test()
    .then(function (result) {
      // $scope.ble += 'Test success:'+ JSON.stringify(arguments)
    }, function (reason) {
      // $scope.ble += 'Test failure:'+ JSON.stringify(arguments)
    })    
  }
  
  $scope.$on('$destory', function () {
    $interval.cancel($scope.testPromise)
  })
  
  $scope.init = function () {
    screen.lockOrientation('portrait-primary')
    test()
  }
})
