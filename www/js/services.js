angular.module('ebike.services', [])

.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [
    { id: 0, name: 'Scruff McGruff' },
    { id: 1, name: 'G.I. Joe' },
    { id: 2, name: 'Miss Frizzle' },
    { id: 3, name: 'Ash Ketchum' }
  ];

  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
})

.factory('$localstorage', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
})

.factory('ActiveBike', function ($localstorage, $cordovaBLE) {
  var key = 'com.extensivepro.ebike.A4ADEFE-3245-4553-B80E-3A9336EB56AB'
  
  return {
    set: function (value) {
      $localstorage.setObject(key, value)
    },
    get: function () {
      return $localstorage.getObject(key)
    },
    scan: function (successCb, errorCb) {
      $cordovaBLE.scan([], 10, successCb, errorCb)
    },
    connect: function (bike) {
      var activeBike = bike || this.get()
      this.set(activeBike)
      return $cordovaBLE.connect(activeBike.id)
    },
    read: function (serviceUUID, characteristicUUID) {
      var bikeId = this.get().id
      return $cordovaBLE.read(bikeId, serviceUUID, characteristicUUID)
    },
    startNotification: function (service, characteristic, successCb, errorCb) {
      $cordovaBLE.startNotification(this.get().id, service, characteristic, successCb, errorCb)
    },
    stopNotification: function (service, characteristic, successCb, errorCb) {
      $cordovaBLE.stopNotification(this.get().id, service, characteristic, successCb, errorCb)
    }
  }
})

.factory('BLEServices', function () {
  return {
    realtimeService: {
      uuid: "0000D000-D102-11E1-9B23-00025B00A5A5",
      power: "0000D00A-D102-11E1-9B23-00025B00A5A5",
      mileage: "0000D00B-1021-1E19-B230-00250B00A5A5",
      speead: "0000D00C-D102-11E1-9B23-00025B00A5A5",
      current: "0000D00D-D102-11E1-9B23-00025B00A5A5"
    }
  }
})