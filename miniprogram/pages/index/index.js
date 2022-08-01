const plugin = requirePlugin('hello-plugin')
var test_eeg = require("../../test/flowtime_eegdata.js")
//配置项参考官方文档：https://docs.affectivecloud.cn/%F0%9F%8E%99%E6%8E%A5%E5%8F%A3%E5%8D%8F%E8%AE%AE/1.%20%E7%BB%BC%E8%BF%B0.html
var config = {
  "session": {
    "url": "wss://server.affectivecloud.com/ws/algorithm/v2/",
    "timeout": 10000,
    "app_key": "93e3cf84-dea1-11e9-ae15-0242ac120002",
    "app_secret": "c28e78f98f154962c52fcd3444d8116f",
    "user_id": "flowttime",
    "upload_cycle": 3
  },
  "services": {
    "biodata": ["eeg"],
    "affective": ["attention"]
  },
  "algorithm_params": {
    "eeg": {
      "tolerance": 2,
      "channel_power_verbose": true,
      "power_mode": "db", // db:分贝，rate:占比
      "filter_mode": "smart", // basic,smart,hard
    }
  }
}

function sleep(d) {
  for (var t = Date.now(); Date.now() - t <= d;);
}

var enterAffectiveCloudManager = null
Page({
  data: {
    items: [],
    currentItem: 0
  },
  onLoad() {


    // enterAffectiveCloudManager.addRawJsonRequestListener(function (msg) {
    // console.log("send msg ", msg)
    // })
    // enterAffectiveCloudManager.addBiodataRealtimeListener(function (data) {
    //   wx.showModal({
    //     content: JSON.stringifyd(data),
    //   })
    // })
    // enterAffectiveCloudManager.addAffectiveDataRealtimeListener(function (data) {

    // })
    console.log("test", parseInt("22"))

  },
  init() {
    enterAffectiveCloudManager = plugin.obtainAffectiveCloudManager(config)
    enterAffectiveCloudManager.init({
      "onSuccess": function () {
        console.log("affective cloud init success")
      },
      "onError": function (error) {
        console.log("affective cloud init error", error)
      }
    })
  },
  upload() {
    var eegData = test_eeg.data
    var datas = eegData.split(",")
    var buffer = new Array()
    for (var i in datas) {
      buffer.push(parseInt(datas[i]))
      if (buffer.length >= 20) {
        if (enterAffectiveCloudManager.isInited()) {
          enterAffectiveCloudManager.appendEEGData(buffer)
        }
        buffer = []
        sleep(12)
        // 用法
      }
    }
    console.log("get report...")
    enterAffectiveCloudManager.getBiodataReport({
      "onSuccess": function (bioReport) {
        console.log("get report biodata success", bioReport)
        enterAffectiveCloudManager.getAffectiveReport({
          "onSuccess": function (affectiveReport) {
            console.log("get report affective success", affectiveReport)
          },
          "onError": function (error) {
            console.log("get report affective error", error)
          }
        })
      },
      "onError": function (error) {
        console.log("get report biodata error", error)
      }
    })
  },
  release() {
    enterAffectiveCloudManager.release({
      "onSuccess": function () {
        console.log("release success")
      },
      "onError": function (error) {
        console.log("release error",error)
      }
    })
  }
})