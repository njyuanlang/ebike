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
      $rootScope.$broadcast('realtime.update')
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

.factory('BLEDevice', function ($localstorage, $cordovaBLE, RTMonitor, $rootScope, $q, Util, $interval) {

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
  
  function testTaskCb(result, task) {
    if(result === 0xE) return
    
    var states = ['pass', 'error']
    var items = task.items.filter(function (item, index) {
      if(item.state === 'error') {
        item.state = 'repairing'
        item.progress = 0
      }
      item.index = index
      return item.state === 'repairing' || item.state === 'testing'
    })
    if(task.state === 'repairing') {
      states = ['broken', 'repaired']
    }
    var itemLen = items.length
    var i = 0
    var count = 0
    this.testInterval = $interval(function () {
      var item = items[i]
      ++item.progress
      if(item.progress === 100) {
        item.state = states[(result>>item.index)&0x1]
        if(item.state === 'pass' || item.state === 'repaired') count++
        if(++i >= itemLen) {
          $interval.cancel(this.testInterval)
          if(task.state === 'testing') {
            task.state = count === itemLen ? 'pass':'error'
          } else {
            task.state = count === itemLen ? 'repaired':'broken'
          }
          task.score += Math.round(count*100/task.items.length)
        }
      }
    }, 10)
  }
  
  BLEDevice.prototype.test = function (task) {
    task.state = 'testing'
    task.score = 0

    if($rootScope.online) {
      ble.startNotification(this.localId, service.uuid, service.test, function (result) {
        testTaskCb(new Uint8Array(result)[0], task)
      })
      this.sendOrder([0x81, 0x81])
    } else {
      testTaskCb(12, task)
    }
  }

  BLEDevice.prototype.repair = function (task) {
    task.state = 'repairing'
    
    if($rootScope.online) {
      ble.startNotification(this.localId, service.uuid, service.repair, function (result) {
        testTaskCb(new Uint8Array(result)[0], task)
      })
      this.sendOrder([0x91, 0x91])
    } else {
      testTaskCb(8, task)
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
  
  function TestTask() {
    this.state = 'idle'
    this.score = 0
    this.items = [
      {id: "brake", progress:0, state:'testing'},
      {id: "motor", progress:0, state:'testing'},
      {id: "controller", progress:0, state:'testing'},
      {id: "steering", progress:0, state:'testing'}
    ]
  }
    
  return TestTask
})
