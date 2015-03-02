angular.module('ebike.services', [])

.factory('Util', function () {

  return {
    getRandomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    },
    byteToDecString: function(buffer) {
      return new Uint8Array(buffer)[0].toString(10)
    },
    hexToBytes: function(hexs) {
      var array = new Uint8Array(hexs.length);
      for (var i = 0, l = hexs.length; i < l; i++) {
        array[i] = hexs[i]
       }
       return array.buffer;
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

.factory('RTMonitor', function ($localstorage, $rootScope, $interval) {
  var service = {
    uuid: "0000D000-D102-11E1-9B23-00025B00A5A5",
    power: "0000D00A-D102-11E1-9B23-00025B00A5A5",// power mileage
    speed: "0000D00B-D102-11E1-9B23-00025B00A5A5" // speed current
  }
  
  var realtime = {
    power: 0,
    mileage: 0,
    speed: 0,
    current: 0
  }
  var fakeCbs = {
    power: function () {
      realtime.power = realtime.power || 100
      realtime.power--
      realtime.mileage = Math.floor(realtime.power/2)
    },
    speed: function (successCb) {
      realtime.speed = realtime.speed || 80
      realtime.speed--
      realtime.current = Math.floor(realtime.speed/5)
    }
  }
  
  var noitficationCbs = {
    power: function (result) {
      var res = new Uint8Array(result) 
      realtime.power = res[0]   
      realtime.mileage = res[1]
      $rootScope.$broadcast('realtime.update')
    },
    speed: function (result) {
      var res = new Uint8Array(result) 
      realtime.speed = res[0]
      realtime.current = res[1]
    }
  }
  
  realtime.notify = function(bikeId, characteristic) {
    if($rootScope.online) {
      ble.startNotification(bikeId, service.uuid, service[characteristic], noitficationCbs[characteristic])
    } else {
      return $interval(function () {
        fakeCbs[characteristic]()
      }, 500, false)
    }
  }
  
  realtime.startNotifications = function (bikeId) {
    realtime.notify(bikeId, "power")
    realtime.notify(bikeId, "speed")
  }
  
  return realtime
})

.factory('BLEDevice', function ($localstorage, $cordovaBLE, RTMonitor, $rootScope, $q, Util, $timeout) {

  var props = ['reminder', 'workmode', 'serialNumber']
  
  function BLEDevice(device) {
    this.localId = device.id
    this.name = device.name
    var bike = $localstorage.getObject(this.localId)
    this.reminder = bike.reminder || {
      overload: true,
      temperature: true,
      voltage: true,
      guard: true,
    }
    this.workmode = bike.workmode || 0
    this.serialNumber = bike.serialNumber
    this.realtime = RTMonitor
  }
  
  BLEDevice.prototype.save = function () {
    var bike = {}
    for (var i = 0; i < props.length; i++) {
      var key = props[i]
      bike[key] = this[key]
    }
    $localstorage.setObject(this.localId, bike)
  }
  
  BLEDevice.prototype.setWorkmode = function (mode) {
    this.workmode = mode
    if($rootScope.online) {
      var hexs = [0xb0, 0xb0]
      hexs[0] += mode
      hexs[1] += mode
      this.sendOrder(hexs)
      this.save()
    }
  }
  
  BLEDevice.prototype.connect = function () {
    var theSelf = this
    return $cordovaBLE.connect(this.localId).then(function (result) {
      theSelf.onConnect(result)
      return result
    })
  }
  
  BLEDevice.prototype.onConnect = function (result) {
    this.startMonitor()
    this.startReminder()
    if(!this.serialNumber) {
      this.readSerialNumber()
    }
  }
  
  BLEDevice.prototype.autoconnect = function () {
    var q = $q.defer()
    var bikeId = this.localId
    var kSelf = this
    $cordovaBLE.isConnected(bikeId)
    .then(function (result) {
      return result
    }, function (reason) {
      return $cordovaBLE.connect(bikeId)
    })
    .then(function (result) {
      kSelf.onConnect(result)
      q.resolve(result)
    }, q.reject)  
    
    return q.promise
  }
  
  BLEDevice.prototype.disconnect = function () {
    return $cordovaBLE.disconnect(this.localId)
  }
  
  BLEDevice.prototype.readSerialNumber = function () {
    var service = {
      uuid: "00009000-D102-11E1-9B23-00025B00A5A5",
      sn: "0000900A-D102-11E1-9B23-00025B00A5A5"
    }
    var theSelf = this
    ble.read(this.localId, service.uuid, service.sn, function (result) {
      theSelf.serialNumber = new Uint8Array(result)
      theSelf.save()
    })
  }
  
  var order = {
    uuid: "00001C00-D102-11E1-9B23-00025B00A5A5",
    order: "00001C01-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.sendOrder = function (hexs) {  
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.order, value) 
  }
  
  BLEDevice.prototype.startMonitor = function () {
    RTMonitor.startNotifications(this.localId)
  }

  var reminder = {
    uuid: "0000D000-D102-11E1-9B23-00025B00A5A5",
    msg: "0000D00C-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.startReminder = function () {
    var config = this.reminder
    function resolveReminder(result) {
      var reminder = {
        overload: config.overload && result & 0x1,
        temperature: config.temperature && result & 0x2,
        voltage: config.temperature && result & 0x4,
        guard: config.temperature && result & 0x8
      }
      return reminder
    }
    if($rootScope.online) {
      ble.startNotification(this.localId, reminder.uuid, reminder.msg, function (result) {
        var res = new Uint8Array(result)
        var date = new Date().toISOString()
        localforage.config({name: "ebike.reminder"})
        localforage.setItem(Date.now(), resolveReminder(res[0]))
      })
    } else {
      localforage.config({name: "ebike.reminder"})
      localforage.clear().then(function (err) {
        for (var i = 0; i < 20; i++) {
          localforage.setItem(Date.now()+'', resolveReminder(7))
        }
      })
    }
  }
  
  BLEDevice.prototype.fetchReminders = function (type) {
    var q = $q.defer()
    var reminders = []
    localforage.config({name: "ebike.reminder"})
    localforage.keys()
    .then(function (keys) {
      var limit = Math.min(20, keys.length)
      var fetchKeys = keys.splice(0-limit).reverse()
      Promise.all(fetchKeys.map(function (key) {
        return localforage.getItem(key).then(function (value) {
          if(value[type]) {
            reminders.push(parseInt(key, 10))
          }
          return value
        })
      })).then(function (result) {
        q.resolve(reminders)
      })      
    })    
    return q.promise
  }
  
  var service = {
    uuid: "0000B000-D102-11E1-9B23-00025B00A5A5",
    test: "0000B00A-D102-11E1-9B23-00025B00A5A5",
    repair: "0000B00B-D102-11E1-9B23-00025B00A5A5"
  }
  
  BLEDevice.prototype.test = function (successCb, errorCb) {  
    if($rootScope.online) {
      ble.startNotification(this.localId, service.uuid, service.test, function (result) {
        successCb(new Uint8Array(result)[0])
      }, function (reason) {
        errorCb(reason)
      })
      this.sendOrder([0x81, 0x81])
    } else {
      $timeout(function () {
        successCb(12)
      }, 2000)
    }
  }

  BLEDevice.prototype.repair = function (successCb, errorCb) {
    if($rootScope.online) {
      ble.startNotification(this.localId, service.uuid, service.repair, function (result) {
        successCb(new Uint8Array(result)[0])
      }, function (reason) {
        errorCb(reason)
      })
      this.sendOrder([0x91, 0x91])
    } else {
      $timeout(function () {
        successCb(8)
      }, 2000)
    }
  }

  return BLEDevice
  
})

.service('ActiveBLEDevice', function ($localstorage, BLEDevice, $rootScope) {
  var keys = {
    activebike: 'com.extensivepro.ebike.A4ADEFE-3245-4553-B80E-3A9336EB56AB'
  }
  
  function getBLEDevice(device) {
    return device.id ? new BLEDevice(device) : null
  }
  var _activeBike = getBLEDevice($localstorage.getObject(keys.activebike))
  var _mockupBike = new BLEDevice({id: 'abc123', name: "mockup bike"})
  var service = {
    set: function (device) {
      if($rootScope.online) {
        _activeBike = getBLEDevice(device)
        $localstorage.setObject(keys.activebike, device)
      }
    },
    get: function () {
      return $rootScope.online ? _activeBike : _mockupBike
    }
  }
  
  return service
})

.factory('TestTask', function ($q, $interval) {
  
  function TestTask(bike) {
    this.bike = bike
    this.state = 'idle'
    this.prompt = ""
    this.score = 100
    this.items = [
      {id: "brake", "name": "刹车"},
      {id: "motor", "name": "电机"},
      {id: "controller", "name": "控制器"},
      {id: "steering", "name": "转把"}
    ]
  }
  
  TestTask.prototype.startTest = function () {
    this.state = 'testing'
    this.prompt = "系统扫描中..."
    this._onProgressing(this.items, '检测中')

    var theThis = this
    this.bike.test(function (result) {
      theThis._onTestDone(result)
    })
  }
  
  TestTask.prototype._onTestDone = function (result) {
    if(result === 0xE) return
    this._onProgressDone()
    this.prompt = "扫描完成"
    this.state = 'pass'
    this.score = calulateScore(result)
    this.items.forEach(function (item) {
      item.progress = 100
      if(item.id === 'brake') item.error = result&0x1;
      if(item.id === 'motor') item.error = (result&0x2)>>1;
      if(item.id === 'controller') item.error = (result&0x4)>>2;
      if(item.id === 'steering') item.error = (result&0x8)>>3;
      item.desc = item.error?"故障":"正常"
      if(item.error) this.state = 'fault'
    }, this)
  }
  
  TestTask.prototype.startRepair = function () {
    this.state = 'repairing'
    this.prompt = "系统修复中..."
    var items = this.items.filter(function (item) {
      return item.error
    })
    this._onProgressing(items, '修复中')
    
    var theThis = this
    this.bike.repair(function (result) {
      if(result === 0xE) return
      theThis._onProgressDone()
      theThis.prompt = "修复结束"
      theThis.state = 'done'
      theThis.score += 100-calulateScore(result)
      items.forEach(function (item) {
        item.progress = 100
        if(item.id === 'brake') item.fixed = result&0x1;
        if(item.id === 'motor') item.fixed = (result&0x2)>>1;
        if(item.id === 'controller') item.fixed = (result&0x4)>>2;
        if(item.id === 'steering') item.fixed = (result&0x8)>>3;
        item.desc = item.fixed?"完成":"失败"
      })
    })
  }
  
  TestTask.prototype.health = function () {
    var q = $q.defer()
    var theSelf = this
    this.bike.test(function (result) {
      theSelf.score = calulateScore(result)
      q.resolve(theSelf.score)
    }, function (reason) {
      q.reject(reason)
    })
    return q.promise
    
  }
  
  TestTask.prototype._onProgressing = function (items, desc) {
    items.forEach(function (item) {
      item.progress = 0
      item.desc = desc
    })

    var activeEntityIndex = 0
    this.progressingPromise = $interval(function () {
      items.forEach(function (item) {
        item.progress++
        if(item.progress >= 90) {
          activeEntityIndex++
          if(activeEntityIndex === items.length) {
            $interval.cancel(this.progressingPromise)
          }
        }
      })
    }, 50, false)
  }
  
  TestTask.prototype._onProgressDone = function () {
    $interval.cancel(this.progressingPromise)
  }
  
  return TestTask
  
  function calulateScore(result) {
    var len = 4
    var count = 0
    for (var i = 0; i <= len; i++) {
      if((result>>i)&0x1) count++
    }
    return (len-count)*25
  }
})
