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

.controller('BikesAddCtrl', function($scope, $state, $cordovaBLE, $q) {
  
  $scope.entities = []

  function scanSuccessCb(result) {
    $scope.entities.push(result)
  }
  
  function scanErrorCb(reason) {
    $scope.$broadcast('scroll.refreshComplete')
  }
  
  function doScan() {
    $scope.entities = []
    
    $cordovaBLE.scan([], 10, scanSuccessCb, scanErrorCb)
  }
  $scope.doScan = doScan

  $scope.selectEntity = function (item) {
  }
  
  $scope.init = function () {
    doScan()
  }
})
