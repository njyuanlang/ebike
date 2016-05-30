'use strict'

angular.module('ebike.filters',[])

.filter("reminderDic", function ($translate) {

  var dictionary = {
    "overload": "",
    "temperature": "",
    "voltage": "",
    "guard": ""
  }

  $translate(['REMIND_OVERLOAD', 'REMIND_TEMPERATRUE', 'REMIND_VOLTAGE',
    'REMIND_GUARD']).then(function (result) {
    dictionary.overload = result.REMIND_OVERLOAD;
    dictionary.temperature = result.REMIND_TEMPERATRUE;
    dictionary.voltage = result.REMIND_VOLTAGE;
    dictionary.guard = result.REMIND_GUARD;
  });

  return function (key) {
    return dictionary[key];
  }
})

.filter("dateFormat", function () {
  return function (date, format) {
    format = format || 'YYYY-MM-DD HH:mm:ss'
    return moment(date).format(format)
  }
})

.filter("testItem", function ($translate) {
  var testItems = {
    id: {
      "brake": "",
      "motor": "",
      "controller": "",
      "steering": ""
    },
    state: {
      testing: '',
      pass: '',
      error: '',
      repairing: '',
      repaired: '',
      broken: ''
    }
  }

  $translate(['BRAKE','MOTOR','CONTROLLER','STEERING','TESTING','PASS','ERROR',
  'REPAIRING', 'REPAIRED', 'BROKEN']).then(function (result) {
    testItems.id.brake = result.BRAKE;
    testItems.id.motor = result.MOTOR;
    testItems.id.controller = result.CONTROLLER;
    testItems.id.steering = result.STEERING;
    testItems.state.testing = result.TESTING;
    testItems.state.pass = result.PASS;
    testItems.state.error = result.ERROR;
    testItems.state.repairing = result.REPAIRING;
    testItems.state.repaired = result.REPAIRED;
    testItems.state.broken = result.BROKEN;
  });

  return function (item, dic) {
    var key = item[dic]
    return testItems[dic][key]
  }
})

.filter("testTask", function ($translate) {
  var dictionary = {
    state: {
      idle: '',
      testing: '',
      pass: '',
      error: '',
      repairing: '',
      repaired: '',
      broken: ''
    }
  }
  $translate(['STATE_IDLE', 'STATE_TESTING', 'STATE_PASS', 'STATE_ERROR',
    'STATE_REPAIRING', 'STATE_REPAIRED', 'STATE_BROKEN']).then(function (result) {
    for (var key in result) {
      var keys = key.toLowerCase().split('_');
      dictionary[keys[0]][keys[1]] = result[key];
    }
  });
  return function (task, dic) {
    var key = task[dic]
    return dictionary[dic][key]
  }
})

.filter("registerErrorPrompt", function () {
  var dictionary = {
    "user not exist": "手机号码不存在，请输入正确手机",
    "no authcode": "请输入验证码",
    "not found auth code": "没有找打验证码，请重新获取",
    "invalid auth code": "验证码不正确",
    "outdate auth code": "验证码已经过期",
    "username already exist": "手机已经存在，请换其他手机"
  }
  return function (msg) {
    return dictionary[msg]
  }
})

.filter("loginErrorPrompt", function () {
  var dictionary = {
    "username or email is required": "用户名不能为空",
    "login failed": "用户名或密码错误"
  }

  return function (msg) {
    return dictionary[msg] || "登录失败"
  }
})

.filter("moment", function () {
  return function (input, format) {
    return moment(input).format(format || 'YYYY-MM-DD HH:mm:ss');
  }
})

.filter("moment_unix", function () {
  return function (input, format) {
    var m = moment.unix(input);
    if('from_now' === format) {
      return m.fromNow();
    } else {
      return m.format(format || 'YYYY-MM-DD HH:mm:ss');
    }
  }
})

.filter("merchant_ability", function () {
  var dictionary = {
    "anybrand": "维修任意品牌",
    "charge": "充电",
    "onsite": "5公里内上门服务",
    "wheel2": "修2轮车",
    "wheel3": "修3轮车"
  }
  return function (key) {
    return dictionary[key]
  }
})
