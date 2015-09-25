controllers

.controller('MerchantsCtrl', function($scope, $state, $cordovaGeolocation) {

  var map = new AMap.Map('container',{
    zoom: 15,
    center: [118.786331,31.936223]
    // center: [position.coords.longitude, position.coords.latitude]
  });

  AMap.plugin(['AMap.Geolocation', 'AMap.CloudDataLayer'],function(){
    var geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,//是否使用高精度定位，默认:true
      timeout: 10000,          //超过10秒后停止定位，默认：无穷大
      maximumAge: 0,           //定位结果缓存0毫秒，默认：0
      convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
      showButton: true,        //显示定位按钮，默认：true
      buttonPosition: 'LB',    //定位按钮停靠位置，默认：'LB'，左下角
      buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
      showMarker: true,        //定位成功后在定位到的位置显示点标记，默认：true
      showCircle: true,        //定位成功后用圆圈表示定位精度范围，默认：true
      panToLocation: true,     //定位成功后将定位到的位置作为地图中心点，默认：true
      zoomToAccuracy:true      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
    });
    map.addControl(geolocation);

    var cloudDataLayer = new AMap.CloudDataLayer('55ffc0afe4b0ead8fa4df390', {
      clickable: true
    });
    cloudDataLayer.setMap(map);

    AMap.event.addListener(cloudDataLayer, 'click', function (result) {
      console.debug(JSON.stringify(result.data));
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

  var options = {timeout: 10000, enableHighAccuracy: true};
 
  $cordovaGeolocation.getCurrentPosition(options).then(function(position){
    map.setCenter([position.coords.longitude, position.coords.latitude]);
  }, function(error){
    console.log("Could not get location: "+JSON.stringify(error));
  });
  
  $scope.add = function () {
    $state.go('^.merchant-add', {position: map.getCenter()});
  }
})

.controller('MerchantAddCtrl', function($scope, $state, Poi, $ionicLoading) {

  $scope.entity = {
    _location: [118.58883, 31.837322],
    anybrand: true,
    charge: true,
    onsite: false,
    wheel2: true,
    wheel3: true
  };

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
    $scope.entity._location = $scope.markerPosition || $state.params.position || $scope.entity._location;
    console.log($scope.entity._location, $scope.markerPositon, $state.params.position);
    map.setCenter($scope.entity._location);
    marker.setPosition($scope.entity._location);
    if(geocoder) {
      geocoder.getAddress($scope.entity._location, function(status, result){
        if(status=='error') {
          console.log('amap service error');
        }
        if(status=='no_data') {
          console.log("no data, try other key words");
        }
        else {
          var ac = result.regeocode.addressComponent;
          $scope.entity.province = ac.province;
          $scope.entity.city = ac.city;
          $scope.entity.district = ac.district;
          $scope.entity._address = ac.street+ac.streetNumber;
          console.log(result);
        }
      });
    }
  });

  $scope.chooseImage = function () {
    console.log('==========='+$scope.entity);
    $scope.entity.avatar = "img/logo.png";
  };
  
  $scope.submitForm = function (isValid) {
    $ionicLoading.show({
      template: "正在上传商户信息...",
      duration: 10000
    });
    $scope.entity._location = $scope.entity._location.toString();
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

.controller('MerchantMarkCtrl', function($scope, $state, $cordovaGeolocation, $rootScope, $ionicLoading) {

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
    center: [118.58883, 31.837322]
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

  var options = {timeout: 10000, enableHighAccuracy: true};
 
  $cordovaGeolocation.getCurrentPosition(options).then(function(position){
    map.setCenter([position.coords.longitude, position.coords.latitude]);
  }, function(error){
    console.debug("Could not get location: "+JSON.stringify(error));
  });
  
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