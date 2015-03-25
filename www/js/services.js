angular.module('ebike.services', ['ebike-services', 'region.service'])

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
  var speeds = [0, 20, 50, 40, 20, 30,45,5,32]
  var speedIndex = 0
  var fakeCbs = {
    power: function () {
      realtime.power = realtime.power || 100
      realtime.power--
      // realtime.power = 0
      realtime.mileage = Math.floor(realtime.power/2)
      // $rootScope.$broadcast('realtime.update')
    },
    speed: function (successCb) {
      realtime.speed = speeds[speedIndex]
      speedIndex++
      speedIndex %= speeds.length
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
      }, 400, false)
    }
  }
  
  realtime.startNotifications = function (bikeId) {
    realtime.notify(bikeId, "power")
    realtime.notify(bikeId, "speed")
  }
  
  return realtime
})

.factory('BLEDevice', function ($localstorage, $cordovaBLE, RTMonitor, $rootScope, $q, Util, $interval, $timeout, $window, TestTask) {

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
    this.task = new TestTask()
  }
  
  BLEDevice.prototype.save = function () {
    $localstorage.setObject(this.bike.localId, this.bike)
  }
  
  BLEDevice.prototype.setWorkmode = function (mode) {
    this.bike.workmode = mode
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
    this.sendSpec()
    this.setWorkmode(this.bike.workmode%8)
    if(!this.bike.serialNumber) {
      this.readSerialNumber()
    }
  }
  
  BLEDevice.prototype.isConnected = function (bikeId) {
    var q = $q.defer()
    if($window.ble) {
      return $cordovaBLE.isConnected(bikeId)
    } else {
      q.resolve({})
    }
    return q.promise
  }
  
  BLEDevice.prototype.autoconnect = function () {
    var q = $q.defer()
    var bikeId = this.localId
    var kSelf = this
    this.isConnected(bikeId)
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
    if(!$window.ble) return
    return $cordovaBLE.disconnect(this.localId)
  }
  
  BLEDevice.prototype.readSerialNumber = function () {
    if(!$rootScope.online) return
    var service = {
      uuid: "00009000-D102-11E1-9B23-00025B00A5A5",
      sn: "0000900A-D102-11E1-9B23-00025B00A5A5"
    }
    var theSelf = this
    ble.read(this.localId, service.uuid, service.sn, function (result) {
      theSelf.bike.serialNumber = new Uint8Array(result)
      theSelf.save()
    })
  }
  
  var order = {
    uuid: "00001C00-D102-11E1-9B23-00025B00A5A5",
    order: "00001C01-D102-11E1-9B23-00025B00A5A5",
    spec: "00001C02-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.sendOrder = function (hexs) {  
    if(!$rootScope.online) return
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.order, value) 
  }
  BLEDevice.prototype.sendSpec = function () {
    if(!$rootScope.online) return
    var hexs = [this.bike.voltage, this.bike.current, 0, 0]
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.spec, value) 
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
      item.progress = 100
      item.state = states[(result>>item.index)&0x1]
      if(item.state === 'pass' || item.state === 'repaired') count++
      if(++i >= itemLen) {
        $interval.cancel(this.testInterval)
        task.score += Math.round(count*100/task.items.length)
        if(task.state === 'testing') {
          task.state = count === itemLen ? 'pass':'error'
          // only motor error can be repaired, so pass 
          if(task.items[1].state === 'error' && task.score === 75) {
            task.state = 'pass'
          }
        } else {
          task.state = count === itemLen ? 'repaired':'broken'
        }
      }
    }, 500)
  }
  
  BLEDevice.prototype.test = function (task) {
    this.task = task
    task.state = 'testing'
    task.score = 0

    if($rootScope.online) {
      ble.startNotification(this.localId, service.uuid, service.test, function (result) {
        testTaskCb(new Uint8Array(result)[0], task)
      })
      this.sendOrder([0x81, 0x81])
    } else {
      testTaskCb(10, task)
    }
  }

  BLEDevice.prototype.repair = function (task) {
    var task
    task.state = 'repairing'
    
    if($rootScope.online) {
      ble.startNotification(this.localId, service.uuid, service.repair, function (result) {
        testTaskCb(new Uint8Array(result)[0], task)
      })
      this.sendOrder([0x91, 0x91])
    } else {
      testTaskCb(2, task)
    }
  }

  return BLEDevice
  
})

.service('ActiveBLEDevice', function (BLEDevice, $rootScope, BikeService) {

  function getBLEDevice(device) {
    return device.id ? new BLEDevice(device) : null
  }
  var _activeBike = getBLEDevice(BikeService.getActive())
  var _mockupBike = new BLEDevice({id: 'abc123', name: "demo bike", workmode:0})
  var service = {
    set: function (bike) {
      if($rootScope.online) {
        _activeBike = getBLEDevice(bike)
        BikeService.setActive(bike)
      }
    },
    get: function () {
      return $rootScope.online ? _activeBike : _mockupBike
    }
  }
  
  return service
})

.service('BikeService', function ($q, $localstorage) {
  var keys = {
    activebike: 'com.extensivepro.ebike.A4ADEFE-3245-4553-B80E-3A9336EB56AB'
  }
  var _activeBike = {}
  return {
    bikes: [],
    getBikes: function () {
      return this.bikes
    },
    getBike: function (bikeId) {
      for (var i = 0; i < this.bikes.length; i++) {
        if(this.bikes[i].id === bikeId) return this.bikes[i]
      }
    },
    deleteBike: function (bikeId) {
      var q = $q.defer()
      this.bikes.some(function (bike, index, arr) {
        if(bike.id === bikeId) {
          arr.splice(index, 1)
          q.resolve(bike)
          return true
        } else {
          return false
        }
      })
      return q.promise
    },
    getActive: function () {
      if(!_activeBike.id) {
        _activeBike = $localstorage.getObject(keys.activebike)
        if(_activeBike.id) this.bikes.push(_activeBike)
      }
      return _activeBike
    },
    setActive: function (bike) {
      _activeBike = bike
      $localstorage.setObject(keys.activebike, bike)
    },
    currentBike: {}
  }
})

.service('BrandService', function ($q) {
  return {
    brands: [
      {id:"2", "name": "雅迪"}, 
      {id:"1", "name": "绿佳"}
    ],
    models:[
      {id:"1", "name": "ABC123", brandId:"1", brandName: "绿佳"},
      {id:"2", "name": "DEF456", brandId:"2", brandName: "雅迪"}
    ],
    getBrands: function () {
      return this.brands
    },
    getModels: function (brandId) {
      var models = this.models.filter(function (model) {
        return model.brandId === brandId
      })
      return models
    }
  }
})

.factory('TestTask', function ($q) {
  
  function TestTask() {
    this.state = 'idle'
    this.score = 100
    this.items = [
      {id: "brake", progress:0, state:'testing'},
      {id: "motor", progress:0, state:'testing'},
      {id: "controller", progress:0, state:'testing'},
      {id: "steering", progress:0, state:'testing'}
    ]
  }
    
  return TestTask
})
