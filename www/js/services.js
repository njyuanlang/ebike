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

.factory('RTMonitor', function ($rootScope, $interval, Cruise, $window) {
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

  var workmodes = [
    0, //0x00 normal
    1, //0x01 saving
    2, //0x02 climb
    15, //0x03 speed
    30, //0x04 park
    46, //0x05 push
  ]
  var noitficationCbs = {
    power: function (result) {
      var res = new Uint8Array(result)
      if(res[0] == 255) {
        res[0] = 0;
        realtime.offline = true;
      } else {
        realtime.offline = false;
      }
      if(res[1] == 255) res[1] = 0;
      realtime.power = res[0];
      realtime.mileage = res[1]
      $rootScope.$broadcast('realtime.update')
    },
    speed: function (result) {
      var res = new Uint8Array(result)
      if(res[0] == 255) res[0] = 0;
      if(res[1] == 255) res[1] = 0;
      realtime.speed = res[0]
      realtime.current = res[1]
      if(res[3]) {
        if(res[3]==17) {
          $rootScope.currentBike.antiTheft = true;
        } else if(res[3]===34) {
          $rootScope.currentBike.antiTheft = false;
        }
      }
      if($rootScope.currentBike.antiTheft && res[2]==17) {
        // console.log('realtime.warning=======');
      } else {
        // console.log('antiTheft:'+res[2]);
        // console.log('realtime.allclear========');
      }
      var idx = res[4]||0;
      console.log('Update==speed====='+res[3]+';'+res[4]);
      $rootScope.device.bike.workmode = workmodes[idx];
      // $rootScope.currentBike.workmode = workmodes[idx];
      $rootScope.$broadcast('realtime.update')
    }
  }

  var uploadInterval = null
  var notify = function(localId, characteristic) {
    if($rootScope.online) {
      if(localId) {
        ble.startNotification(localId, service.uuid, service[characteristic], noitficationCbs[characteristic], function () {
          console.log('startNotification Failure: '+characteristic);
        })
      }
      if(fakeIntervals[characteristic]) {
        $interval.cancel(fakeIntervals[characteristic])
        fakeIntervals[characteristic] = null;
      }
    } else {
      if(!fakeIntervals[characteristic]) {
        fakeIntervals[characteristic] = $interval(function () {
          fakeCbs[characteristic]()
        }, 400, false)
      }
    }
  }
  var stopNotify = function (localId, characteristic) {
    if($rootScope.online&&$window.ble) {
      if(localId) {
        ble.stopNotification(localId, service.uuid, service[characteristic], function () {
          console.log('stopNotification Success: '+characteristic);
        }, function () {
          console.log('stopNotification Failure: '+characteristic);
        })
      }
    }
    if(fakeIntervals[characteristic]) {
      $interval.cancel(fakeIntervals[characteristic])
      fakeIntervals[characteristic] = null;
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
      uploadInterval = $interval(uploadFn, 300000, false)
      uploadFn()
    }
  }

  realtime.stopNotifications = function (localId) {
    stopNotify(localId, "power")
    stopNotify(localId, "speed")
    $interval.cancel(uploadInterval)
    uploadInterval = null
    realtime.power = 0
    realtime.mileage = 0
    realtime.speed = 0
    realtime.current = 0
  }

  return realtime
})

.factory('BLEDevice', function ($cordovaBLE, RTMonitor, $rootScope, $q, Util, $interval, $timeout, $window, TestTask, Test, $ionicLoading) {

  function BLEDevice(bike) {
    bike = bike || {}
    this.bike = bike
    this.localId = bike.localId
    this.reminder = bike.reminder || {
      overload: true,
      temperature: true,
      voltage: true
      // guard: true
    }
    this.realtime = RTMonitor
    this.realtime.bikeId = bike.id
    this.task = new TestTask(bike)
    this.bike.status = this.status = 'disconnected'
    this.bike.workmode = 0;
  }

  BLEDevice.prototype.setWorkmode = function (mode) {
    if (this.status !== 'connected') return;
    if(this.bike.workmode == mode) mode = 0;
    // if(this.bike.workmode==30||this.bike.workmode==46) {
    //   var cancelMode = this.bike.workmode+1;
    //   if($rootScope.online) {
    //     var hexs = [0xb0+cancelMode, 0xb0+cancelMode];
    //     console.log(cancelMode);
    //     this.sendOrder(hexs);
    //   }
    //   if(mode === 0) {
    //     this.bike.workmode = mode;
    //     return;
    //   }
    // }
    this.bike.workmode = mode;
    if($rootScope.online) {
      var hexs = [0xb0, 0xb0]
      hexs[0] += mode
      hexs[1] += mode
      this.sendOrder(hexs)
    }
  }

  BLEDevice.prototype.connect = function () {
    if(!this.localId) return $q.reject('车辆标示ID不能为空！');
    var connectTimer = setTimeout(this.disconnect, 5000);
    var kThis = this;
    return $cordovaBLE.connect(this.localId).then(function (result) {
      clearTimeout(connectTimer);
      return result;
    })
    .then(function (result) {
      return kThis.pair();
    })
    .catch(function (reason) {
      return $q.reject('无法连接车辆:'+reason);
    })
  }

  var testService = {
    uuid: "0000B000-D102-11E1-9B23-00025B00A5A5",
    test: "0000B00A-D102-11E1-9B23-00025B00A5A5",
    repair: "0000B00B-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.onConnected = function (result) {
    this.status = 'connected';
    this.realtime.startNotifications(this.localId)
    this.startReminder()
    this.sendSpec()
    this.setWorkmode(0)
    var kThis = this
    this.safeMode().then(function (safe) {
      kThis.bike.safe = safe;
      console.log("onConnect Safe Mode:"+safe);
    }, function (reason) {
      console.log(reason);
    });
    this.antiTheft().then(function (enable) {
      kThis.bike.antiTheft = enable
    }, function (reason) {
      console.log(reason);
    });
    if($rootScope.online) {
      this.connectingInterval = $interval(function () {
        kThis.isConnected().then(function (result) {

        }, function (reason) {
          console.log('Check connecting broken: '+reason);
          kThis.disconnect();
        })
      }, 1000)
      ble.startNotification(kThis.localId, testService.uuid, testService.test, function (result) {
        kThis.testTaskCb(new Uint8Array(result)[0], kThis.task)
      })
    }
  }

  BLEDevice.prototype.onDisconnected = function () {
    console.log('Start onDisconnected:'+this.status);
    this.status = 'disconnected'
    this.bike.workmode = 0;
    if(this.connectingInterval) {
      console.log('Cancel Interval');
      $interval.cancel(this.connectingInterval)
      this.connectingInterval = null
    }
    // this.realtime.stopNotifications(this.localId)
  };

  BLEDevice.prototype.isConnected = function () {
    var q = $q.defer()
    var kThis = this;
    if($window.ble && $rootScope.online) {
      $cordovaBLE.isConnected(this.localId).then(function (result) {
        q.resolve(kThis)
      }, function (reason) {
        q.reject(kThis)
      })
    } else {
      q.resolve(this)
    }
    return q.promise
  }

  BLEDevice.prototype.autoconnect = function () {
    console.log('Start autoconnect...'+this.localId+' status:'+this.status);
    var kThis = this;
    var q = $q.defer()
    if(this.localId) {
      if(this.status === 'connecting' || this.status === 'connected') {
        $timeout(function () {
          q.reject(this.status);
        }, 100);
      } else {
        this.status = 'connecting';
        var tryCount = 0;
        var connectTimer = setTimeout(function () {
          q.reject('timeout');
        }, 5000);
        var handleError = function (reason) {
          console.log('Retry '+tryCount+' times');
          if(++tryCount < 3) {
            if(/not found/.test(reason) || /not find/.test(reason) || /pair error/.test(reason)) {
              ble.scan([], 3, function () {}, function () {});
              $timeout(tryConnect, 3000);
            } else {
              tryConnect();
            }
          } else {
            console.log('Try out')
            if(typeof reason === 'object') {
              console.log(JSON.stringify(reason));
            }
            q.reject(reason);
            kThis.disconnect();
          }
        };
        var tryConnect = function () {
          $cordovaBLE.connect(kThis.localId)
          .then(function (result) {
            clearTimeout(connectTimer);
            return kThis.pair();
          })
          .then(function (result) {
            console.log('Success Connected.');
            q.resolve(result);
          })
          .catch(function (reason) {
            console.log('Error: '+reason);
            handleError(reason);
          });
        };
        this.isConnected().then(q.resolve, tryConnect);
      }
    } else {
      q.reject('no localId')
    }

    return q.promise
  }

  BLEDevice.prototype.disconnect = function () {
    if(this.status === 'disconnected') return $q.resolve();
    this.onDisconnected();
    if(!$window.ble || !this.localId) {
      var q = $q.defer();
      $timeout(function () {
        q.resolve()
      },0);
      return q.promise;
    } else {
      return $cordovaBLE.disconnect(this.localId)
      .then(function (result) {
        console.log('disconnect success'+result);
        return result
      }, function (error) {
        console.log('disconnect Failure '+error);
        return error;
      });
    }
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
        q.reject('读取序列号失败'+reason)
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
    pair: "00001C03-D102-11E1-9B23-00025B00A5A5",
    mode: "00001C04-D102-11E1-9B23-00025B00A5A5",
    antitheft: "00001C05-D102-11E1-9B23-00025B00A5A5",
    // changepassword: "00001C06-D102-11E1-9B23-00025B00A5A5",
    statedefine: "00001C06-D102-11E1-9B23-00025B00A5A5"
  }
  BLEDevice.prototype.sendOrder = function (hexs) {
    if(!$rootScope.online || !$window.ble) return;
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.order, value)
  }
  BLEDevice.prototype.sendSpec = function () {
    if(!$rootScope.online || !$window.ble) return;
    if(this.bike.wheeldiameter < 10) this.bike.wheeldiameter = 10;
    var hexs = [this.bike.voltage, this.bike.current, 0, this.bike.wheeldiameter]
    var value = Util.hexToBytes(hexs)
    ble.write(this.localId, order.uuid, order.spec, value)
  }
  BLEDevice.prototype.pair = function (password) {
    password = password||this.bike.password;
    console.log('Start Pair:'+password);
    var q = $q.defer()
    if(!$rootScope.online) {
      q.resolve()
    } else {
      var pairtimer = $timeout(function () {
        q.reject("配对超时,请重新绑定车辆或者重新启动蓝牙再尝试！");
      }, 2000)
      var value = Util.stringToBytes(password)
      var kThis = this
      var checkPassword = function () {
        ble.read(kThis.localId, order.uuid, order.pair, function (result) {
          $timeout.cancel(pairtimer)
          var ret = Util.byteToDecString(result)
          if(ret === "1") {
            kThis.onConnected(result)
            q.resolve(ret)
          } else {
            q.reject('配对密码错误');
          }
        }, function (reason) {
          $timeout.cancel(pairtimer)
          q.reject('无法验证配对密码，请重试'+JSON.stringify(arguments))
        })
      }
      ble.write(this.localId, order.uuid, order.pair, value, function () {
        checkPassword()
      }, function (reason) {
        $timeout.cancel(pairtimer)
        console.log(reason);
        q.reject("设备不支持密码配对功能")
      })
    }
    return q.promise
  }

  BLEDevice.prototype.safeMode = function (mode) {
    var q = $q.defer()
    if(!$rootScope.online || !this.localId || this.status != 'connected') {
      q.resolve(true)
    } else {
      if(mode === undefined) {
        ble.read(this.localId, order.uuid, order.mode, function (result) {
          var ret = Util.byteToDecString(result);
          console.log('safeMode:'+(ret==0x11));
          q.resolve(ret==0x11);
        }, function (reason) {
          console.log('SafeMode Get:'+JSON.stringify(reason))
          q.reject('获取安全模式失败');
        });
      } else {
        var value = Util.hexToBytes(mode?[0xD1, 0xD1]:[0xD2, 0xD2]);
        ble.write(this.localId, order.uuid, order.mode, value, function () {
          q.resolve();
        }, function (reason) {
          console.log('SafeMode Switch:'+JSON.stringify(reason))
          q.reject('切换安全模式失败');
        });
      }
    }
    return q.promise
  };

  BLEDevice.prototype.antiTheft = function (enable) {
    var q = $q.defer()
    var self = this;
    if(!$rootScope.online || !this.localId || this.status != 'connected') {
      q.resolve(true)
    } else {
      if(enable === undefined) {
        ble.read(this.localId, order.uuid, order.antitheft, function (result) {
          var ret = Util.byteToDecString(result);
          console.log('AntiTheft:'+(ret==0x11));
          q.resolve(ret==0x11);
        }, function (reason) {
          console.log('AntiTheft Get:'+JSON.stringify(reason));
          q.reject('获取防盗模式失败');
        });
      } else {
        var value = Util.hexToBytes(enable?[0xE1, 0xE1]:[0xE2, 0xE2]);
        ble.write(this.localId, order.uuid, order.antitheft, value, function () {
          self.bike.antiTheft = enable;
          q.resolve();
        }, function (reason) {
          console.log('AntiTheft Get:'+JSON.stringify(reason));
          q.reject('切换防盗模式失败');
        });
      }
    }
    return q.promise
  };

  // BLEDevice.prototype.changePassword = function (password) {
  //   var q = $q.defer()
  //   if(password.length !== 6) {
  //     q.reject('密码长度不正确');
  //   } else if(!$rootScope.online) {
  //     this.bike.password = password;
  //     q.resolve(true);
  //   } else {
  //     var array = new Uint8Array(8);
  //     array[0] = 0xFE;
  //     array[1] = 0xEF;
  //     for (var i = 2, l = 8; i < l; i++) {
  //       array[i] = password.charCodeAt(i-2);
  //     }
  //     var value = array.buffer;
  //     var kThis = this;
  //     ble.write(this.localId, order.uuid, order.changepassword, value, function () {
  //       kThis.bike.password = password;
  //       console.log('Success Set Password:'+password);
  //       q.resolve();
  //     }, function (reason) {
  //       q.reject('设置密码失败');
  //     });
  //   }
  //   return q.promise;
  // };
  BLEDevice.prototype.statedefine = function (key) {
    var q = $q.defer()

    if(!$rootScope.online) {
      this.bike.customKey = key;
      setTimeout(q.resolve, 10);
    } else if(this.status !== 'connected'|| !$window.ble) {
      setTimeout(function () {
        q.reject('重置功能请连接车辆');
      }, 10);
    } else {
      var kThis = this;
      var value = Util.hexToBytes([key])
      ble.write(this.localId, order.uuid, order.statedefine, value, function () {
        kThis.bike.customKey = key;
        q.resolve();
      }, function (reason) {
        q.reject('自定义按键失败');
      });
    }
    return q.promise;
  };

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
    if(result === 0xE || (task.state !== 'testing' && task.state !== 'repairing')) return;
    if(this.testInterval) return;

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
    var kThis = this
    this.testInterval = $interval(function () {
      var item = items[i]
      item.progress = 100
      item.state = states[(result>>item.index)&0x1]
      if(item.state === 'pass' || item.state === 'repaired') count++
      if(++i == itemLen) {
        $interval.cancel(kThis.testInterval)
        if(task.state === 'testing') {
          task.score = Math.round(count*100/task.items.length)
          task.state = count === itemLen ? 'pass':'error'
          // only motor error can be repaired, so pass
          if(task.items[1].state === 'error' && task.score === 75) {
            task.state = 'pass'
          }
          if(task.bikeId && $rootScope.online) {
            Test.create(task, function (result) {
              task.id = result.id
            })
          }
        } else if(task.state === 'repairing') {
          task.score += Math.round(count*100/task.items.length)
          task.state = count === itemLen ? 'repaired':'broken'
          if(task.bikeId && $rootScope.online) {
            Test.upsert(task)
          }
        }
        kThis.testInterval = null
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
        if(task.state === 'testing' && !kThis.testInterval) $rootScope.$broadcast('test.timeout')
      }, 5000)
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

.service('MyPreferences', function ($rootScope, User, $cordovaPreferences, $localstorage, $q) {

  function successLoad(options) {
    options = options || {};
    $rootScope.currentBike = options.bike || $rootScope.currentBike || {};
    $rootScope.buttonVibrate = options.buttonVibrate;
    console.log('Preferences Load:'+JSON.stringify(options));
  };

  var pref = {
    load: function (dictionary) {
      var q = $q.defer()
      dictionary = dictionary || User.getCurrentId();
      $cordovaPreferences.fetch('MyPreferences', dictionary)
      .success(function (options) {
        // Backward compatibility
        if(!options) {
          $cordovaPreferences.fetch('myEBike', dictionary)
          .success(function (bike) {
            successLoad({bike: bike, buttonVibrate:true});
            pref.save(null, dictionary);
            q.resolve()
          })
          .error(function (err) {
            console.log("fetch myEBike error: "+arguments);
            q.reject(error);
          });
        } else {
          successLoad(options);
          q.resolve();
        }
      })
      .error(function (error) {
        console.log('Load Preferences Failure:'+error);
        successLoad($localstorage.getObject('#EBIKE#MyPreferences'));
        q.resolve();
      });
      return q.promise;
    },
    save: function (options, dictionary) {
      options = options || {
        bike: $rootScope.currentBike || {},
        buttonVibrate: $rootScope.buttonVibrate || true
      };
      dictionary = dictionary || User.getCurrentId();
      $cordovaPreferences.store('MyPreferences', options, dictionary)
      .success(function (result) {
        for (var key in options) {
          $rootScope[key] = options[key];
        }
        console.log('Save Preferences Success!');
      })
      .error(function (error) {
        console.log('Save Preferences Failure:'+error);
        $localstorage.setObject('#EBIKE#MyPreferences', options);
      })
    }
  }

  return pref;
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

.service('PtrService', ['$timeout', '$ionicScrollDelegate', function($timeout, $ionicScrollDelegate) {

  /**
   * Trigger the pull-to-refresh on a specific scroll view delegate handle.
   * @param {string} delegateHandle - The `delegate-handle` assigned to the `ion-content` in the view.
   */
  this.triggerPtr = function(delegateHandle) {

    $timeout(function() {

      var scrollView = $ionicScrollDelegate.$getByHandle(delegateHandle).getScrollView();

      if (!scrollView) return;

      if (scrollView.isNative) {
        var refresher = (angular.element(scrollView.el.children[0].children[0]).controller('ionRefresher'));
        var child = refresher.__getScrollChild();

        refresher.getRefresherDomMethods().show();
        refresher.getRefresherDomMethods().activate();
        refresher.getRefresherDomMethods().start();

        // decelerating to zero velocity
        function easeOutCubic(t) {
            return (--t) * t * t + 1;
        }

        var start = Date.now(),
            duration = 500,
            from = 0,
            Y = 60;

        // scroll loop
        function scroll() {
            var currentTime = Date.now(),
                time = Math.min(1, ((currentTime - start) / duration)),
            // where .5 would be 50% of time on a linear scale easedT gives a
            // fraction based on the easing method
                easedT = easeOutCubic(time);

            overscroll(parseInt((easedT * (Y - from)) + from, 10));

            if (time < 1)
                ionic.requestAnimationFrame(scroll);
        };
        ionic.requestAnimationFrame(scroll);

        var listener = angular.element(scrollView.el.children[0].children[0]).scope().$on("scroll.refreshComplete", function () {
            from = 60;
            Y = 0;
            start = Date.now();
            ionic.requestAnimationFrame(scroll);

            refresher.getRefresherDomMethods().tail();
            refresher.getRefresherDomMethods().deactivate();
            refresher.getRefresherDomMethods().hide();

            listener();
        });

        return;
      }

      scrollView.__publish(
        scrollView.__scrollLeft, -scrollView.__refreshHeight,
        scrollView.__zoomLevel, true);

      var d = new Date();

      scrollView.refreshStartTime = d.getTime();

      scrollView.__refreshActive = true;
      scrollView.__refreshHidden = false;
      if (scrollView.__refreshShow) {
        scrollView.__refreshShow();
      }
      if (scrollView.__refreshActivate) {
        scrollView.__refreshActivate();
      }
      if (scrollView.__refreshStart) {
        scrollView.__refreshStart();
      }

    }, 1000);

  }
}])
