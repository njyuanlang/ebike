controllers

.controller('MerchantsCtrl', function($scope, $state, $ionicTemplateLoader, $ionicBody, $rootScope) {

  var infoWindow = null;
  var map = new AMap.Map('container',{
    zoom: 15
  });
  var geolocation;

  AMap.plugin(['AMap.Geolocation', 'AMap.CloudDataLayer'],function(){

    if(!$scope.isAndroid) {
      geolocation = new AMap.Geolocation({
        enableHighAccuracy: false,//是否使用高精度定位，默认:true
        timeout: 5000,          //超过10秒后停止定位，默认：无穷大
        maximumAge: 3000,           //定位结果缓存0毫秒，默认：0
        // showMarker: false,
        showButton: true,
        buttonPosition: 'LB',
        buttonOffset: new AMap.Pixel(10, 20),
        zoomToAccuracy:true      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
      });
      map.addControl(geolocation);
      AMap.event.addListener(geolocation, 'complete', function (result) {
        setMyPosition(result.position);
      });
      AMap.event.addListener(geolocation, 'error', function (error) {
        console.log("Location error: "+JSON.stringify(error));
      });
      geolocation.getCurrentPosition();
    }

    var cloudDataLayer = new AMap.CloudDataLayer('55ffc0afe4b0ead8fa4df390', {
      clickable: true
    });
    cloudDataLayer.setMap(map);

    AMap.event.addListener(cloudDataLayer, 'click', function (result) {
      $scope.clouddata = result.data;
      $scope.$apply();
      var clouddata = result.data;
      var ability = JSON.parse(clouddata.ability && "{"+clouddata.ability+"}" || "{}")
      $scope.ability = ability;
      $ionicTemplateLoader.compile({
        templateUrl: 'merchant-popover.html',
        scope: $scope,
        appendTo: $ionicBody.get()
      }).then(function (result) {
        infoWindow = new AMap.InfoWindow({
          content: result.element[0],
          closeWhenClickMap: true,
          // isCustom: true,
          size: new AMap.Size(240, 0),
          autoMove: true,
          offset: new AMap.Pixel(0, -25)
        });
        infoWindow.open(map, clouddata._location);
      });
    });
  })

  function setMyPosition(position) {
    $rootScope.myPosition = position;
    map.setZoomAndCenter(15, $rootScope.myPosition);
    if(!$rootScope.myPositionMarker) {
      $rootScope.myPositionMarker = new AMap.Marker();
    }
    $rootScope.myPositionMarker.setPosition($rootScope.myPosition);
    $rootScope.myPositionMarker.setMap(map);
  }

  function androidLocate() {
    navigator.amaplocation.getCurrentPosition(function (result) {
      console.log("amaplocation==="+JSON.stringify(result));
      setMyPosition(new AMap.LngLat(result.lng, result.lat));
    }, function (err) {
      console.log("Location error: "+JSON.stringify(arguments));
    });
  }

  $scope.navigate = function () {
    if(infoWindow) infoWindow.close();
    $scope.MWalk.search($scope.myPosition, $scope.clouddata._location);
  };

  AMap.service(["AMap.Driving"], function() {
    $scope.MWalk = new AMap.Driving({
      panel: result1,
      map: map
    });
  });

  $scope.$on('$ionicView.enter', function () {
    if($scope.isAndroid) {
      androidLocate();
    } else {
      geolocation.getCurrentPosition();
    }
    if ($scope.MWalk) {
      $scope.MWalk.clear();
    }
  })
})

.controller('MerchantAddCtrl', function($scope, $state, Poi, $ionicLoading, $ionicPopup) {

  $scope.entity = {};
  $scope.ability = {
    anybrand: true,
    charge: true,
    onsite: false,
    wheel2: true,
    wheel3: true
  }

  $scope.$on("$ionicView.enter", function () {
    var ac = $scope.positionResult.regeocode.addressComponent;
    $scope.entity.province = ac.province;
    $scope.entity.city = ac.city;
    $scope.entity.district = ac.district;
    $scope.entity._address = ac.street+ac.streetNumber;
    $scope.$apply();
  });

  $scope.chooseImage = function () {
    // console.log('==========='+$scope.entity);
    $scope.entity.avatar = "img/logo.png";
  };

  $scope.setAddress = function () {
    $ionicPopup.prompt({
      title: '输入地址',
      // template: ' Template',
      defaultText: $scope.entity._address,
      cancelText: '取消',
      okText: '保存'
    }).then(function(res) {
      if (res) {
        $scope.entity._address = res;
      }
    });
  }

  $scope.submitForm = function (isValid) {
    $ionicLoading.show({
      template: "正在上传商户信息...",
      duration: 10000
    });
    $scope.entity._location = $scope.positionResult.position.toString();
    var abilityJSON = JSON.stringify($scope.ability);
    $scope.entity.ability = abilityJSON.substr(1, abilityJSON.length-2);
    Poi.create($scope.entity, function (value) {
      $ionicLoading.show({
        template: "上传商户信息成功",
        duration: 1000
      })
      $scope.$ionicGoBack(-2);
    }, function (res) {
      $ionicLoading.show({
        template: "上传商户信息失败",
        duration: 2000
      });
    });
  }

})

.controller('MerchantMarkCtrl', function($scope, $state, $rootScope) {

  $scope.positionResult = {};
  var map;
  AMapUI.loadUI(['misc/PositionPicker'], function(PositionPicker) {
    map = new AMap.Map('container3',{
        zoom:16,
        center: $scope.myPosition
    })
    var positionPicker = new PositionPicker({
        mode:'dragMap',
        map:map
    });

    positionPicker.on('success', function (positionResult) {
      // console.log(positionResult);
      $scope.positionResult = positionResult;
      $rootScope.positionResult = positionResult;
      $scope.$apply();
    });

    positionPicker.start();
  });

  $scope.selectPoi = function (poi) {
    map.setCenter(poi.location);
  };

  $scope.confirm = function () {
    $state.go('tab.merchant-add');
  };
})
