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
    },
    getArray: function (key) {
      return JSON.parse($window.localStorage[key] || '[]');
    },
    pushObject: function (key, value) {
      var arr = this.getArray(key);
      arr.push(value)
      $window.localStorage[key] = JSON.stringify(arr);
    }
  }
})

.factory('ActiveBike', function ($localstorage, $cordovaBLE, $q) {
  var keys = {
    activebike: 'com.extensivepro.ebike.A4ADEFE-3245-4553-B80E-3A9336EB56AB',
    reminds: {
      overload: 'com.extensivepro.ebike.598DC984-D8FB-4620-ADD3-D871E6A40C51',
      temperature: 'com.extensivepro.ebike.C4014443-9461-4DE8-AE61-4B5B2226D946',
      voltage: 'com.extensivepro.ebike.CDF4843B-8C4D-4947-8FFB-7AA15B334F12',
      guard: 'com.extensivepro.ebike.9C7FC6F5-6A4D-405E-BE07-3B7B8C2227FF'
    }
  }
  var services = {
    remind: {
      uuid: "0000A000-D102-11E1-9B23-00025B00A5A5",
      msg: "0000A00A-D102-11E1-9B23-00025B00A5A5"
    },
    realtime: {
      uuid: "0000D000-D102-11E1-9B23-00025B00A5A5",
      power: "0000D00A-D102-11E1-9B23-00025B00A5A5",
      mileage: "0000D00B-1021-1E19-B230-00250B00A5A5",
      speed: "0000D00C-D102-11E1-9B23-00025B00A5A5",
      current: "0000D00D-D102-11E1-9B23-00025B00A5A5"
    },
    test: {
      uuid: "0000B000-D102-11E1-9B23-00025B00A5A5",
      test: "0000B00A-D102-11E1-9B23-00025B00A5A5",
      repair: "0000B00B-D102-11E1-9B23-00025B00A5A5"
    },
    order: {
      uuid: "00001C00-D102-11E1-9B23-00025B00A5A5",
      order: "00001C01-D102-11E1-9B23-00025B00A5A5"
    },
    device: {
      uuid: "00009000-D102-11E1-9B23-00025B00A5A5",
      sn: "0000900A-D102-11E1-9B23-00025B00A5A5"
    },
    workmode: {
      uuid: "0000E000-D102-11E1-9B23-00025B00A5A5",
      workmode: "0000E00A-D102-11E1-9B23-00025B00A5A5"
    }
  }
  
  function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
     }
     return array.buffer;
  }
  
  function hexToBytes(hexs) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = hexs.length; i < l; i++) {
      array[i] = hexs[i]
     }
     return array.buffer;
  }

  // ASCII only
  function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }
  
  function byteToDecString(buffer) {
    return new Uint8Array(buffer)[0].toString(10)
  }
  
  return {
    set: function (value) {
      $localstorage.setObject(keys.activebike, value)
    },
    get: function () {
      return $localstorage.getObject(keys.activebike)
    },
    scan: function (successCb, errorCb) {
      ble.scan([], 10, successCb, errorCb)
    },
    connect: function (bike) {
      var activeBike = bike || this.get()
      this.set(activeBike)
      return $cordovaBLE.connect(activeBike.id)
    },
    disconnect: function () {
      return $cordovaBLE.disconnect(this.get().id)
    },
    autoconnect: function () {
      var q = $q.defer()
      var bikeId = this.get().id
      $cordovaBLE.isConnected(bikeId)
      .then(function (result) {
        return result
      }, function (reason) {
        return $cordovaBLE.connect(bikeId)
      })
      .then(function () {
        this.startNotifyRemind()
      }, q.reject)
      
      return q.promise
    },
    startNotifyPower: function (successCb, errorCb) {
      var service = services.realtime
      ble.startNotification(this.get().id, service.uuid, service.power, function (result) {
        successCb(byteToDecString(result))
      }, errorCb)
    },
    stopNotifyPower: function (successCb, errorCb) {
      var service = services.realtime
      ble.stopNotification(this.get().id, service.uuid, service.power, successCb, errorCb)
    },
    startNotifyMileage: function (successCb, errorCb) {
      var service = services.realtime
      ble.startNotification(this.get().id, service.uuid, service.mileage, function (result) {
        successCb(byteToDecString(result))
      }, errorCb)
    },
    test: function (successCb, errorCb) {
      var service = services.test
      ble.startNotification(this.get().id, service.uuid, service.test, function (result) {
        ble.stopNotification(this.get().id, service.uuid, service.test)
        successCb(byteToDecString(result))
      }, function (reason) {
        ble.stopNotification(this.get().id, service.uuid, service.test)
        errorCb(reason)
      })
    },
    repair: function (successCb, errorCb) {
      var service = services.test
      ble.startNotification(this.get().id, service.uuid, service.repair, function (result) {
        successCb(byteToDecString(result))
      }, errorCb)
    },
    workmode: function () {
      var q = $q.defer()
      var service = services.workmode
      ble.read(this.get().id, service.uuid, service.workmode, function (result) {
        var res = new Uint8Array(result)
        q.resolve(res[0] & 0xb)
      }, function (reason) {
        q.reject(reason)
      })
      return q.promise
    },
    startNotifyRemind: function (successCb, errorCb) {
      var service = services.remind
      ble.startNotification(this.get().id, service.uuid, service.msg, function (result) {
        var res = new Uint8Array(result)
        var date = new Date().toString()
        if(res[0] & 0x1) {
          $localstorage.pushObject(keys.reminds.overload, {created:date})
        }
        if(res[0] & 0x2) {
          $localstorage.pushObject(keys.reminds.temperature, {created:date})
        }
        if(res[0] & 0x4) {
          $localstorage.pushObject(keys.reminds.voltage, {created:date})
        }
        if(res[0] & 0x8) {
          $localstorage.pushObject(keys.reminds.guard, {created:date})
        }
      }, errorCb)
    },
    startNotifySpeed: function (successCb, errorCb) {
      var service = services.realtime
      ble.startNotification(this.get().id, service.uuid, service.speed, function (result) {
        successCb(byteToDecString(result))
      }, errorCb)
    },
    startNotifyCurrent: function (successCb, errorCb) {
      var service = services.realtime
      ble.startNotification(this.get().id, service.uuid, service.current, function (result) {
        successCb(byteToDecString(result))
      }, errorCb)
    },
    device: function () {
      var q = $q.defer()
      var service = services.device
      ble.read(this.get().id, service.uuid, service.sn, function (result) {
        q.resolve(bytesToString(result))
      }, function (reason) {
        q.reject(reason)
      })
      return q.promise
    }
  }
})
