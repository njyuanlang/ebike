controllers

.controller('TestCtrl', function($scope, $state, $interval, ActiveBike) {

  $scope.testState = ""
  
  $scope.testScore = 75
  
  $scope.entities = ActiveBike.testItems
  
  function test() {
    $scope.testState = "系统正在扫描中..."
    for(var item in $scope.entities) {
      $scope.entities[item].progress = 0
      $scope.entities[item].state = "检测中"
    }
    
    $scope.activeEntityIndex = 0
    $scope.testPromise = $interval(function () {
      for(var item in $scope.entities) {
        $scope.entities[item].progress++
        if($scope.entities[item].progress >= 90) {
          $scope.activeEntityIndex++
          if($scope.activeEntityIndex === Object.keys($scope.entities).length) {
            $interval.cancel($scope.testPromise)
          }
        }
      }
    }, 50, false)
    
    ActiveBike.notify('test', 'test', function (result) {
      $scope.testState = "扫描完成"
      $interval.cancel($scope.testPromise)
      for(var item in result) {
        $scope.entities[item].progress = 100
        $scope.entities[item].state = $scope.entities[item].error?"完成":"故障"
      }
    }, function (reason) {
    })    
  }
  
  $scope.repair = function () {
    
  }
  
  $scope.$on('$destory', function () {
    $interval.cancel($scope.testPromise)
  })
  
  $scope.init = function () {
    test()
  }
})
