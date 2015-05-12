angular.module('ebike.services', ['ebike-services', 'region.service', 'jrCrop'])

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
    },
    stringToBytes: function (string) {
      var array = new Uint8Array(string.length);
      for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
      }
      return array.buffer;
    },
    bytesToString: function (buffer) {
      return String.fromCharCode.apply(null, new Uint8Array(buffer))
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
      if(!value || value === undefined) {
        $window.localStorage[key] = undefined       
      } else {
        $window.localStorage[key] = JSON.stringify(value);
      }
    },
    getObject: function(key) {
      var value = $window.localStorage[key] || '{}'
      if(value === 'undefined') value = '{}'
      return JSON.parse(value);
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

.factory('RTMonitor', function ($localstorage, $rootScope, $interval, Cruise) {
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
  var speeds = [0, 20, 50, 40, 20, 30,45,75,32, 5]
  var speedIndex = 0
  var fakeCbs = {
    power: function () {
      realtime.power = realtime.power || 100
      realtime.power--
      // realtime.power = 0
      realtime.mileage = Math.floor(realtime.power/2)
      // $rootScope.$broadcast('realtime.update')
    },
    speed: function () {
      realtime.speed = speeds[speedIndex]
      speedIndex++
      speedIndex %= speeds.length
      realtime.current = Math.floor(realtime.speed/5)
    }
  }
  var fakeIntervals = {}
  
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
  
  var uploadInterval = null
  var notify = function(localId, characteristic) {
    if($rootScope.online) {
      if(localId) {
        ble.startNotification(localId, service.uuid, service[characteristic], noitficationCbs[characteristic])
      }
      stopNotify(localId, characteristic)
    } else {
      if(!fakeIntervals[characteristic]) {
        fakeIntervals[characteristic] = $interval(function () {
          fakeCbs[characteristic]()
        }, 400, false)
      }
    }
  }
  var stopNotify = function (localId, characteristic) {
    if(fakeIntervals[characteristic]) {
      $interval.cancel(fakeIntervals[characteristic])
    }
  }
  
  var uploadFn = function () {
    if(!realtime.bikeId) return;
    
    Cruise.create({
      power: realtime.power,
      mileage: realtime.mileage,
      speed: realtime.mileage,
      current: realtime.current,
      bikeId: realtime.bikeId
    })
  }
  
  realtime.startNotifications = function (localId) {
    notify(localId, "power")
    notify(localId, "speed")
    if(!uploadInterval && realtime.bikeId) {
      uploadInterval = $interval(uploadFn, 60000, false)
      uploadFn()
    }
  }
  
  realtime.stopNotifications = function (localId) {
    stopNotify(localId, "power")
    stopNotify(localId, "speed")
    $interval.cancel(uploadInterval)
    realtime.power = 0
    realtime.mileage = 0
    realtime.speed = 0
    realtime.current = 0
  }
  
  return realtime
})

.factory('BLEDevice', function ($cordovaBLE, RTMonitor, $rootScope, $q, Util, $interval, $timeout, $window, TestTask, Test) {

  var connectingInterval = null
  
  var onDisconnected = function (device) {
    $rootScope.$broadcast('device.disconnected')

    if(connectingInterval) {
      $interval.cancel(connectingInterval)
      connectingInterval = null
    }
    device.connected = false
    RTMonitor.stopNotifications(device.localId)
  }
  
  function BLEDevice(bike) {
    this.bike = bike
    this.localId = bike.localId
    this.reminder = bike.reminder || {
      overload: true,
      temperature: true,
      voltage: true,
      guard: true,
    }
    this.realtime = RTMonitor
    this.realtime.bikeId = bike.id
    this.task = new TestTask(bike)
  }
  
  BLEDevice.prototype.setWorkmode = function (mode) {
    this.bike.workmode = mode
    if($rootScope.online) {
      var hexs = [0xb0, 0xb0]
      hexs[0] += mode
      hexs[1] += mode
      this.sendOrder(hexs)
    }
  }
  
  BLEDevice.prototype.connect = function () {
    var theSelf = this
    return $cordovaBLE.connect(this.localId).then(function (result) {
      theSelf.onConnected(result)
      return result
    })
  }
  
  var testService = {
    uuid: "0000B000-D102-11E1-9B23-00025B00A5A5",
    test: "0000B00A-D102-11E1-9B23-00025B00A5A5",
    repair: "0000B00B-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.onConnected = function (result) {
    this.connected = true
    RTMonitor.startNotifications(this.localId)
    this.startReminder()
    this.sendSpec()
    this.setWorkmode(this.bike.workmode%8)
    var kThis = this
    if($rootScope.online) {
      ble.startNotification(kThis.localId, testService.uuid, testService.test, function (result) {
        kThis.testTaskCb(new Uint8Array(result)[0], kThis.task)
      })
      connectingInterval = $interval(function () {
        kThis.isConnected(kThis.localId).then(function (result) {
          
        }, function (reason) {
          onDisconnected(kThis)          
        })
      }, 1000)
    }
  }
  
  BLEDevice.prototype.isConnected = function (bikeId) {
    var q = $q.defer()
    if($window.ble && $rootScope.online) {
      return $cordovaBLE.isConnected(bikeId)
    } else {
      this.connected = false
      q.resolve({})
    }
    return q.promise
  }
  
  BLEDevice.prototype.autoconnect = function () {
    var q = $q.defer()
    if(!this.localId) return q.reject()
    var bikeId = this.localId
    var kSelf = this
    this.isConnected(bikeId)
    .then(function (result) {
      q.resolve(result)
    }, function (reason) {
      kSelf.connected = false
      return $cordovaBLE.connect(bikeId)
    })
    .then(function (result) {
      kSelf.onConnected(result)
      q.resolve(result)
    }, q.reject)  
    
    return q.promise
  }
  
  BLEDevice.prototype.disconnect = function () {
    onDisconnected(this)
    if(!$window.ble) return
    return $cordovaBLE.disconnect(this.localId)
  }
  
  BLEDevice.prototype.readSerialNumber = function () {
    var q = $q.defer()
    if($window.ble && $rootScope.online) {
      var service = {
        uuid: "00009000-D102-11E1-9B23-00025B00A5A5",
        sn: "0000900A-D102-11E1-9B23-00025B00A5A5"
      }
      var theSelf = this
      ble.read(this.localId, service.uuid, service.sn, function (result) {
        theSelf.bike.serialNumber = Util.bytesToString(result)
        q.resolve(theSelf.bike.serialNumber)
      }, function (reason) {
        q.reject(reason)
      })
    } else {
      q.resolve("000000000000")
    }
    return q.promise
  }
  
  var order = {
    uuid: "00001C00-D102-11E1-9B23-00025B00A5A5",
    order: "00001C01-D102-11E1-9B23-00025B00A5A5",
    spec: "00001C02-D102-11E1-9B23-00025B00A5A5",
    pair: "00001C03-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.sendOrder = function (hexs) {  
    if(!$rootScope.online) return
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.order, value) 
  }
  BLEDevice.prototype.sendSpec = function () {
    if(!$rootScope.online) return
    var hexs = [this.bike.voltage, this.bike.current, 0, this.bike.wheeldiameter]
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.spec, value) 
  }
  BLEDevice.prototype.pair = function (password) {
    var q = $q.defer()
    if(!$rootScope.online) {
      q.resolve()
    } else {
      var value = Util.stringToBytes(password)
      ble.write(this.localId, order.uuid, order.pair, value, function () {
        q.resolve()
      }, function () {
        q.reject("invalidate passowrd")
      }) 
    }
    return q.promise
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
      $rootScope.$broadcast('reminder.update', {reminder: reminder})
      return reminder
    }
    if($rootScope.online) {
      ble.startNotification(this.localId, reminder.uuid, reminder.msg, function (result) {
        var res = new Uint8Array(result)
        localforage.config({name: "ebike.reminder"})
        localforage.setItem(Date.now()+'', resolveReminder(res[0]))
      })
    } else {
      localforage.clear().then(function (err) {
        // localforage.config({name: "ebike.reminder"})
        // $interval(function () {
        //   localforage.setItem(Date.now()+'', resolveReminder(7))
        // }, 2000)
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
    
  BLEDevice.prototype.testTaskCb = function (result, task) {
    if(result === 0xE && (task.state === 'testing' || task.state === 'repairing')) return
    
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
    var testInterval = $interval(function () {
      var item = items[i]
      item.progress = 100
      item.state = states[(result>>item.index)&0x1]
      if(item.state === 'pass' || item.state === 'repaired') count++
      if(++i == itemLen) {
        $interval.cancel(testInterval)
        if(task.state === 'testing') {
          task.score = Math.round(count*100/task.items.length)
          task.state = count === itemLen ? 'pass':'error'
          // only motor error can be repaired, so pass 
          if(task.items[1].state === 'error' && task.score === 75) {
            task.state = 'pass'
          }
          if(task.bikeId) {
            Test.create(task, function (result) {
              task.id = result.id
            })
          }
        } else if(task.state === 'repairing') {
          task.score += Math.round(count*100/task.items.length)
          task.state = count === itemLen ? 'repaired':'broken'
          if(task.bikeId) {
            Test.upsert(task)
          }
        }
      }
    }, 1000)
  }
  
  BLEDevice.prototype.test = function () {
    this.task = new TestTask(this.bike)
    var task = this.task
    task.state = 'testing'
    task.score = 0

    if($rootScope.online) {
      this.sendOrder([0x81, 0x81])
      var kThis = this
      $timeout(function () {
        if(task.state === 'testing') $rootScope.$broadcast('test.timeout')
      }, 7000)
    } else {
      this.testTaskCb(10, task)
    }
  }

  BLEDevice.prototype.repair = function (task) {
    task.state = 'repairing'
    
    if($rootScope.online) {
      this.sendOrder([0x91, 0x91])
      this.testTaskCb(2, task)
    } else {
      this.testTaskCb(2, task)
    }
  }

  return BLEDevice
  
})

.service('currentBike', function () {
  var _currentBike = null
  return {
    set: function (bike) {
      _currentBike = bike
    },
    get: function () {
      return _currentBike
    }
  }
})

.service('ActiveBLEDevice', function (BLEDevice, $rootScope, $localstorage, currentBike) {

  var keys = {
    activebike: 'com.extensivepro.ebike.A4ADEFE-3245-4553-B80E-3A9336EB56AB'
  }

  function getBLEDevice(bike) {
    return new BLEDevice(bike || {workmode: 0})
  }
  var _activeBLE = getBLEDevice($localstorage.getObject(keys.activebike))
  currentBike.set(_activeBLE.bike)
  var service = {
    set: function (bike) {
      _activeBLE = getBLEDevice(bike)
      $localstorage.setObject(keys.activebike, bike)
    },
    get: function () {
      return _activeBLE
    }
  }
  
  return service
})

.factory('TestTask', function ($q) {
  
  function TestTask(bike) {
    this.state = 'idle'
    this.score = 100
    this.items = [
      {id: "brake", progress:0, state:'testing'},
      {id: "motor", progress:0, state:'testing'},
      {id: "controller", progress:0, state:'testing'},
      {id: "steering", progress:0, state:'testing'}
    ]
    this.bikeId = bike.id
  }
    
  return TestTask
})
