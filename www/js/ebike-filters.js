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
      repaired: '已修复',
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
      testing: '系统扫描中...',
      pass: '扫描结束',
      error: '扫描结束',
      repairing: '系统修复中...',
      repaired: '修复结束',
      broken: '修复结束'
    }
  }
  return function (task, dic) {
    var key = task[dic]
    return dictionary[dic][key]
  }
})