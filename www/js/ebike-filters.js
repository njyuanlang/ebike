'use strict'

angular.module('ebike.filters',[])

.filter("reminderDic", function () {
  var dictionary = {
    "overload": "超载提醒",
    "temperature": "温度过高提醒",
    "voltage": "电瓶低电压提醒",
    "guard": "防盗提醒"
  }
  
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

.filter("testItem", function () {
  var testItems = {
    id: {
      "brake": "刹车",
      "motor": "电机",
      "controller": "控制器",
      "steering": "转把"
    },
    state: {
      testing: '检测中',
      pass: '正常',
      error: '故障',
      repairing: '修复中',
      repaired: '修复',
      broken: '损坏'
    }
  } 
  
  return function (item, dic) {
    var key = item[dic]
    return testItems[dic][key]
  }
})

.filter("testTask", function () {
  var dictionary = {
    state: {
      idle: '准备测试',
      testing: '系统扫描中...',
      pass: '扫描结束',
      error: '故障! 请到维修点维修',
      repairing: '系统修复中...',
      repaired: '修复结束',
      broken: '故障! 请到维修点维修'
    }
  }
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
    "login failed": "登录失败"
  }
  
  return function (msg) {
    return dictionary[msg] || "未知错误"
  }
})