const plugin = requirePlugin('hello-plugin')
//配置项参考官方文档：https://docs.affectivecloud.cn/%F0%9F%8E%99%E6%8E%A5%E5%8F%A3%E5%8D%8F%E8%AE%AE/1.%20%E7%BB%BC%E8%BF%B0.html
var config = {
  "session": {
    "url": "wss://server-test.affectivecloud.cn/ws/algorithm/v2/",
    "timeout": 10000,
    "app_key": "015b7118-b81e-11e9-9ea1-8c8590cb54f9",
    "app_secret": "cd9c757ae9a7b7e1cff01ee1bb4d4f98",
    "user_id": "wxtest",
    "upload_cycle": 3
  },
  "services": {
    "biodata": ["eeg", "hr"],
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
Page({
  data: {
    items: [],
    currentItem: 0
  },
  onLoad() {
    var enterAffectiveCloudManager = plugin.obtainAffectiveCloudManager(config)
    enterAffectiveCloudManager.init({
      "onSuccess": function () {
        console.log("affective cloud init success")
      },
      "onError": function (error) {
        console.log("affective cloud init error", error)
      }
    })
  },
  addItem() {
    this.data.items.push(this.data.currentItem++)
    this.setData({
      items: this.data.items,
      currentItem: this.data.currentItem
    })
  }
})