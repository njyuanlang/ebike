controllers

.controller('MerchantsCtrl', function($scope, $state, $ionicTemplateLoader, $ionicBody, $rootScope) {

  var map = new AMap.Map('container',{
    zoom: 15
  });

  AMap.plugin(['AMap.Geolocation', 'AMap.CloudDataLayer'],function(){

    if($scope.isAndroid) {
      // AMap.event.addListener(geolocation, 'click', function (result) {
      //   console.log('=====geolocation===click====');
      //   androidLocate();
      // });
    } else {
      var geolocation = new AMap.Geolocation({
        enableHighAccuracy: false,//是否使用高精度定位，默认:true
        timeout: 5000,          //超过10秒后停止定位，默认：无穷大
        maximumAge: 3000,           //定位结果缓存0毫秒，默认：0
        zoomToAccuracy:true      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
      });
      map.addControl(geolocation);
      AMap.event.addListener(geolocation, 'complete', function (result) {
        $rootScope.myPosition = result.position;
        map.setZoomAndCenter(15, $rootScope.myPosition);
      });
      AMap.event.addListener(geolocation, 'error', function (error) {
        console.debug("Location error: "+JSON.stringify(error));
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
        var infoWindow = new AMap.InfoWindow({
          // content: document.getElementById('info'),
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

  function androidLocate() {
    navigator.amaplocation.getCurrentPosition(function (result) {
      console.log("amaplocation==="+JSON.stringify(result));
      $rootScope.myPosition = new AMap.LngLat(result.lng, result.lat);
      map.setZoomAndCenter(15, $rootScope.myPosition);
    }, function (err) {
      console.debug("Location error: "+JSON.stringify(arguments));
    });
  }
  
  if($scope.isAndroid) {
    androidLocate();
  }

  $scope.add = function () {
    $state.go('^.merchant-add');
  };
  
  $scope.navigate = function () {
    $scope.MWalk.search($scope.myPosition, $scope.clouddata._location);
  };
  
  AMap.service(["AMap.Driving"], function() {
    $scope.MWalk = new AMap.Driving({
      map: map
    });
  });
})

.controller('MerchantAddCtrl', function($scope, $state, Poi, $ionicLoading) {

  $scope.entity = {
    _location: $scope.myPosition,
  };
  $scope.ability = {
    anybrand: true,
    charge: true,
    onsite: false,
    wheel2: true,
    wheel3: true
  }

  var map = new AMap.Map('container2',{zoom: 15, dragEnable: false, zoomEnable: false});
  var marker = new AMap.Marker({position: $scope.entity._location, map: map});
  var geocoder = null;
  
  AMap.service(["AMap.Geocoder"], function() {
    geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: "all"
    });
  });
  
  $scope.$on("$ionicView.enter", function () {
    $scope.entity._location = $scope.markerPosition || $scope.entity._location;
    map.setCenter($scope.entity._location);
    marker.setPosition($scope.entity._location);
    if(geocoder) {
      geocoder.getAddress($scope.entity._location, function(status, result){
        if(status=='error') {
          console.debug('amap service error');
        }
        if(status=='no_data') {
          console.debug("no data, try other key words");
        }
        else {
          var ac = result.regeocode.addressComponent;
          $scope.entity.province = ac.province;
          $scope.entity.city = ac.city;
          $scope.entity.district = ac.district;
          $scope.entity._address = ac.street+ac.streetNumber;
          console.debug(result);
        }
      });
    }
  });

  $scope.chooseImage = function () {
    console.debug('==========='+$scope.entity);
    $scope.entity.avatar = "img/logo.png";
  };
  
  $scope.submitForm = function (isValid) {
    $ionicLoading.show({
      template: "正在上传商户信息...",
      duration: 10000
    });
    $scope.entity._location = $scope.entity._location.toString();
    var abilityJSON = JSON.stringify($scope.ability);
    $scope.entity.ability = abilityJSON.substr(1, abilityJSON.length-2);
    Poi.create($scope.entity, function (value) {
      $ionicLoading.show({
        template: "上传商户信息成功",
        duration: 1000
      })
      $scope.$ionicGoBack();
    }, function (res) {
      $ionicLoading.show({
        template: "上传商户信息失败",
        duration: 2000
      });
    });
  }
  
})

.controller('MerchantMarkCtrl', function($scope, $state, $rootScope, $ionicLoading) {

  var marker = null;
  var _onclick = function (e) {
    if(marker) return;
    
    marker = new AMap.Marker({
      draggable: true,
      raiseOnDrag: true,
      position : e.lnglat,
      map : map
    });  
  };

  var map = new AMap.Map('container3',{
    zoom: 15,
    center: $scope.myPosition
  });
  map.on('click', _onclick);

  AMap.plugin(['AMap.Geolocation', 'AMap.CloudDataLayer'],function(){
    var geolocation = new AMap.Geolocation({
      timeout: 10000,          //超过10秒后停止定位，默认：无穷大
      zoomToAccuracy:true      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
    });
    map.addControl(geolocation);

    var cloudDataLayer = new AMap.CloudDataLayer('55ffc0afe4b0ead8fa4df390', {
      clickable: true
    });
    cloudDataLayer.setMap(map);

    AMap.event.addListener(cloudDataLayer, 'click', function (result) {
      var clouddata = result.data;
      var content = "<h3><font face='微软雅黑'color='#36F'>"+clouddata._name+"</font></h3><hr/>"+
        "<font color='#000'>地址："+clouddata._address+"<br/>"+
        "电话："+clouddata.telephone+"<br/>"+
        "创建时间："+clouddata._createtime+"</font>";
      var infoWindow = new AMap.InfoWindow({
        content: content,
        size: new AMap.Size(300, 0),
        autoMove: true,
        offset: new AMap.Pixel(0, -25)
      });
      infoWindow.open(map, clouddata._location);
    });
  })

  $scope.confirm = function () {
    if(!marker) {
      return $ionicLoading.show({
        template: "请在地图上标记位置！",
        duration: 2000
      });
    }
    $rootScope.markerPosition = marker.getPosition();
    marker = null;
    $scope.$ionicGoBack();
  };
  
})