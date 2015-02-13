controllers

.controller('BikesCtrl', function($scope, $state) {
  
  $scope.entities = [
    {
      id: "1",
      brand: "元朗",
      model: "ABC123"
    },
    {
      id: "2",
      brand: "雅迪",
      model: "DEF456"
    }
  ]

  $scope.activeEntityChange = function (item) {
    console.log('activeEntityChange:', item)
    $scope.entity = item
    $scope.entityId = $scope.entity.id
  }
  
  $scope.showDetail = function (item) {
    console.log('ShowDetail:', item)
  }
  
  $scope.activeEntityChange($scope.entities[0])
})

.controller('BrandsCtrl', function($scope, $state) {
  $scope.entities = [
    {
      id: "2",
      index: 'F',
      brands: [
        {
          "name": "泛盈"
        },
        {
          "name": "发达"
        }
      ]
    },
    {
      id: "3",
      index: 'Y',
      brands: [
        {
          "name": "元朗"
        },
        {
          "name": "雅迪"
        }
      ]
    }
  ]
  
  $scope.selectEntity = function (item) {
    $state.go('models')
  }
})

.controller('ModelsCtrl', function($scope, $state) {
  $scope.entities = [
    {
      "name": "ABC123"
    },
    {
      "name": "DEF456"
    }
  ]

  $scope.selectEntity = function (item) {
    $state.go('bikes-add')
  }
})

.controller('BikesAddCtrl', function($scope, $state, ActiveBike, $timeout, $ionicLoading) {
  
  $scope.entities = []

  function scanSuccessCb(result) {
    $scope.entities.push(result)
    $scope.$apply()
  }
  
  function scanErrorCb(reason) {
    $scope.$broadcast('scroll.refreshComplete')
  }
  
  function doScan() {
    $scope.entities = []
    ActiveBike.scan(scanSuccessCb, scanErrorCb)
    $timeout(function () {
      $scope.$broadcast('scroll.refreshComplete')
    }, 5000)
  }
  $scope.doScan = doScan

  $scope.selectEntity = function (item) {
    
    ActiveBike.connect(item)
    .then(function (result) {
      return $ionicLoading.show({
        template: '连接到爱车'+item.name,
        duration: 2000
      })
    }, function (reason) {
      $ionicLoading.show({
        template: "连接失败："+reason,
        duration: 2000
      })
      // alert(reason)
    })
    .then(function () {
      $state.go('home')
    })
    
    $ionicLoading.show({
      template:'正在连接'+item.name+"...",
      duration: 3000
    }).then(function () {
      $ionicLoading.show({
        template: "无法连接到爱车",
        duration: 2000
      })
    })
  }
  
  $scope.init = function () {
    doScan()
  }
})
