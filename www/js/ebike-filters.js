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