const plugin = requirePlugin('hello-plugin')
var test_eeg = require("../../test/flowtime_eegdata.js")
var test_hr = require("../../test/flowtime_hrdata.js")
//配置项参考官方文档：https://docs.affectivecloud.cn/%F0%9F%8E%99%E6%8E%A5%E5%8F%A3%E5%8D%8F%E8%AE%AE/1.%20%E7%BB%BC%E8%BF%B0.html
var config = {
  "session": {
    "url": "wss://server-test.affectivecloud.cn/ws/algorithm/v2/",
    "timeout": 10000,
    "app_key": "015b7118-b81e-11e9-9ea1-8c8590cb54f9",
    "app_secret": "cd9c757ae9a7b7e1cff01ee1bb4d4f98",
    "user_id": "wxtest4",
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

var enterAffectiveCloudManager = null
Page({
  data: {
    items: [],
    currentItem: 0
  },
  init() {
    enterAffectiveCloudManager = plugin.obtainAffectiveCloudManager(config)
    enterAffectiveCloudManager.addRawJsonRequestListener(function (msg) {
      console.log("send msg ", msg)
    })
    enterAffectiveCloudManager.init({
      "onSuccess": function () {
        // console.log("affective cloud init success")
      },
      "onError": function (error) {
        console.log("affective cloud init error", error)
      }
    })
  },
  upload() {
    var eegData = test_eeg.data
    var datas = eegData.split(",")
    var index = 0
    var timer = setInterval(function () {
      if (index + 20 < datas.length) {
        const list = datas.slice(index, index + 20).map(
          function (item) {
            return parseInt(item)
          }
        )
        index = index + 20
        if (enterAffectiveCloudManager.isInited()) {
          enterAffectiveCloudManager.appendEEGData(list)
        }
      } else {
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
        clearInterval(timer)
      }
    }, 12)
  },
  release() {
    enterAffectiveCloudManager.release({
      "onSuccess": function () {
        console.log("release success")
      },
      "onError": function (error) {
        console.log("release error", error)
      }
    })
  }
})