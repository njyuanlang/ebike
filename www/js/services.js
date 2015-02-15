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

.factory('Reminder', function ($localstorage, $rootScope) {
  var keys = {
    overload: 'com.extensivepro.ebike.598DC984-D8FB-4620-ADD3-D871E6A40C51',
    temperature: 'com.extensivepro.ebike.C4014443-9461-4DE8-AE61-4B5B2226D946',
    voltage: 'com.extensivepro.ebike.CDF4843B-8C4D-4947-8FFB-7AA15B334F12',
    guard: 'com.extensivepro.ebike.9C7FC6F5-6A4D-405E-BE07-3B7B8C2227FF',
    config: 'com.extensivepro.ebike.9C122F58-2E16-4D93-BCBB-1B4B039D140D'
  }
  
  var service = {
    uuid: "0000A000-D102-11E1-9B23-00025B00A5A5",
    msg: "0000A00A-D102-11E1-9B23-00025B00A5A5"
  }
  
  var _config = $localstorage.getObject(keys.config)
  _config.overload = _config.overload || {on:true, "name": "超载提醒"}
  _config.temperature = _config.temperature || {on:true, "name": "温度过高提醒"}
  _config.voltage = _config.voltage || {on:true, "name": "电瓶低电压提醒"}
  _config.guard = _config.guard || {on:true, "name": "防盗提醒"}

  return {
    getConfig: function () {
      return _config
    },
    setConfig: function (cfg) {
      if(cfg) {
        for(var key in cfg) {
          _config[key] = cfg[key]
        }
        $localstorage.setObject(keys.config, _config)
      }
    },
    startNotify: function (bikeId) {
      return;
      ble.startNotification(bikeId, service.uuid, service.msg, function (result) {
        var res = new Uint8Array(result)
        var date = new Date().toISOString()
        if(_config.overload.on && res[0] & 0x1) {
          $localstorage.pushObject(keys.overload, {created:date})
        }
        if(_config.temperature.on && res[0] & 0x2) {
          $localstorage.pushObject(keys.temperature, {created:date})
        }
        if(_config.voltage.on && res[0] & 0x4) {
          $localstorage.pushObject(keys.voltage, {created:date})
        }
        if(_config.guard.on && res[0] & 0x8) {
          $localstorage.pushObject(keys.guard, {created:date})
        }
      })
    },
    getRemind: function (key) {
      return $localstorage.getArray(keys[key])
    }
  }
})

.factory('RTMonitor', function ($localstorage, $rootScope, $interval, Util) {
  var service = {
    uuid: "0000D000-D102-11E1-9B23-00025B00A5A5",
    power: "0000D00A-D102-11E1-9B23-00025B00A5A5",
    mileage: "0000D00B-D102-11E1-9B23-00025B00A5A5",
    speed: "0000D00C-D102-11E1-9B23-00025B00A5A5",
    current: "0000D00D-D102-11E1-9B23-00025B00A5A5"
  }
  
  var fakeCbs = {
    power: function (successCb) {
      var p = $rootScope.powerprogress || 100
      successCb(p)
      $rootScope.powerprogress = --p
    },
    mileage: function (successCb) {
      var p = $rootScope.mileagesprogress || 100
      successCb(Math.floor(p/2))
      $rootScope.mileagesprogress = --p
    },
    speed: function (successCb) {
      successCb(Util.getRandomInt(0, 100))
    },
    current: function (successCb) {
      successCb(Util.getRandomInt(0, 100))
    }
  }  
  function notify(bikeId, characteristic, successCb, errorCb) {
    if(!$rootScope.online) {
      return $interval(function () {
        fakeCbs[characteristic](successCb)
      }, 500, false)
    }
    ble.startNotification(bikeId, service.uuid, service[characteristic], function (result) {
      successCb(Util.byteToDecString(result))
    }, errorCb)
  }
  
  return {
    notify: notify
  }
})

.factory('Tester', function ($localstorage, $rootScope, $interval, Util, $timeout, $q) {
  var service = {
    uuid: "0000B000-D102-11E1-9B23-00025B00A5A5",
    test: "0000B00A-D102-11E1-9B23-00025B00A5A5",
    repair: "0000B00B-D102-11E1-9B23-00025B00A5A5"
  }

  var order = {
    uuid: "00001C00-D102-11E1-9B23-00025B00A5A5",
    order: "00001C01-D102-11E1-9B23-00025B00A5A5"
  }
  
  function sendOrder(hexs, bikeId) {
    var value = Util.hexToBytes(hexs)
    ble.write(bikeId, order.uuid, order.order, value)
  }
  
  function test(bikeId, successCb, errorCb) {
    if($rootScope.online) {
      ble.startNotification(bikeId, service.uuid, service.test, function (result) {
        successCb(new Uint8Array(result)[0])
      }, function (reason) {
        errorCb(reason)
      })
      sendOrder([0x81, 0x81], bikeId)
    } else {
      $timeout(function () {
        successCb(12)
      }, 2000)
    }
  }
  
  function repair(bikeId, successCb, errorCb) {
    if($rootScope.online) {
      ble.startNotification(bikeId, service.uuid, service.repair, function (result) {
        successCb(new Uint8Array(result)[0])
      }, function (reason) {
        errorCb(reason)
      })
      sendOrder([0x91, 0x91], bikeId)
    } else {
      $timeout(function () {
        successCb(8)
      }, 2000)
    }
  }
  
  function health(bikeId) {
    var q = $q.defer()
    function score(result) {
      var len = 4
      var count = 0
      for (var i = 0; i <= len; i++) {
        if((result>>i)&0x1) count++
      }
      return (len-count)*25
    }
    test(bikeId, function (result) {
      q.resolve(score(result))
    }, function (reason) {
      q.reject(reason)
    })
    return q.promise
  }
  
  return {
    health: health,
    test: test,
    repair: repair
  }
})

.factory('TestTask', function (ActiveBike, $interval) {
  
  function TestTask() {
    this.state = 'idle'
    this.prompt = ""
    this.score = 0
    this.items = [
      {id: "brake", "name": "刹车"},
      {id: "motor", "name": "电机"},
      {id: "controller", "name": "控制器"},
      {id: "steering", "name": "转把"}
    ]
  }
  
  TestTask.prototype.test = function () {
    this.state = 'testing'
    this.prompt = "系统扫描中..."
    initProgress(this.items, '检测中')

    progressing(this.items)

    var theThis = this
    ActiveBike.notify('test', 'test', function (result) {
      if(result === 0xE) return
      theThis.prompt = "扫描完成"
      theThis.state = 'pass'
      $interval.cancel(theThis.progressingPromise)
      theThis.items.forEach(function (item) {
        item.progress = 100
        if(item.id === 'brake') item.error = result&0x1;
        if(item.id === 'motor') item.error = (result&0x2)>>1;
        if(item.id === 'controller') item.error = (result&0x4)>>2;
        if(item.id === 'steering') item.error = (result&0x8)>>3;
        item.desc = item.error?"故障":"正常"
        if(theThis.state === 'pass' && item.error) theThis.state = 'fault'
      })
    })
    
  }
  
  TestTask.prototype.repair = function () {
    this.state = 'repairing'
    this.prompt = "系统修复中..."
    var items = this.items.filter(function (item) {
      return item.error
    })
    initProgress(items, '修复中')
    
    progressing(items)
    
    var theThis = this
    ActiveBike.notify('test', 'repair', function (result) {
      if(result === 0xE) return
      theThis.prompt = "修复结束"
      theThis.state = 'done'
      $interval.cancel(theThis.progressingPromise)
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
  
  return TestTask
  
  function initProgress(items, desc) {
    items.forEach(function (item) {
      item.progress = 0
      item.desc = desc
    })
  }
  
  function progressing(items) {
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
})

.factory('ActiveBike', function ($localstorage, $rootScope, $cordovaBLE, $q, Reminder, RTMonitor, Util, Tester) {
  var keys = {
    activebike: 'com.extensivepro.ebike.A4ADEFE-3245-4553-B80E-3A9336EB56AB'
  }
  var services = {
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
  
  // ASCII only
  function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }
  
  function sendOrder(hexs, bikeId) {
    var order = services.order
    var value = Util.hexToBytes(hexs)
    ble.write(bikeId, order.uuid, order.order, value)
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
      return $cordovaBLE.connect(activeBike.id).then(function (result) {
        Reminder.startNotify(activeBike.id)
        return result
      })
    },
    disconnect: function () {
      return $cordovaBLE.disconnect(this.get().id)
    },
    autoconnect: function () {
      var q = $q.defer()
      var bikeId = this.get().id
      if(bikeId) {
        $cordovaBLE.isConnected(bikeId)
        .then(function (result) {
          return result
        }, function (reason) {
          return $cordovaBLE.connect(bikeId)
        })
        .then(function (result) {
          Reminder.startNotify(bikeId)
          q.resolve(result)
        }, q.reject)        
      } else {
        q.reject('not found bike')
      }
      
      return q.promise
    },
    notify: function (service, characteristic, successCb, errorCb) {
      var bikeId = this.get().id
      if(service === 'realtime') {
        RTMonitor.notify(bikeId, characteristic, successCb, errorCb)
      } else if (service === 'test') {
        Tester[characteristic](bikeId, successCb, errorCb)
      }
    },
    health: function () {
      return Tester.health(this.get().id)
    },
    workmode: function () {
      var q = $q.defer()
      if($rootScope.online) {
        var service = services.workmode
        ble.read(this.get().id, service.uuid, service.workmode, function (result) {
          var res = new Uint8Array(result)
          q.resolve(res[0] & 0xb)
        }, function (reason) {
          q.reject(reason)
        })
      } else {
        var mode = $rootScope.fakeWorkmode || 0
        q.resolve(mode)
      }
      return q.promise
    },
    setWorkmode: function (mode) {
      if($rootScope.online) {
        var hexs = [0xb0, 0xb0]
        if(mode == 'saving') {
          hexs[0] = 0xb1
          hexs[1] = 0xb1
        } else if(mode == 'climbing') {
          hexs[0] = 0xb2
          hexs[1] = 0xb2
        }
        sendOrder(hexs)
      } else {
        $rootScope.fakeWorkmode = mode
      }
    },
    device: function () {
      var q = $q.defer()
      var service = services.device
      ble.read(this.get().id, service.uuid, service.sn, function (result) {
        q.resolve(new Uint8Array(result))
      }, function (reason) {
        q.reject(reason)
      })
      return q.promise
    }
  }
})
