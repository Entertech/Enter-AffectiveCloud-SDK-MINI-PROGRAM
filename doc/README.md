# 回车情感云SDK（小程序）

## 简介

回车情感云SDK微信小程序插件

## 集成

在小程序管理后台通过appid查找插件并添加

## 使用

### 初始化

```js
var config = {
  "session": {
    "url": "wss://server.affectivecloud.cn/ws/algorithm/v2/",//情感云地址
    "timeout": 10000,//情感云超时时间
    "app_key": "appKey",//需向管理员申请
    "app_secret": "appSecret",//需向管理员申请
    "user_id": "userId",//规则自定义
    "upload_cycle": 3//上传周期。1代表0.6秒返回一次实时数据 3代表为1.8秒，依次类推
  },
  "services": {
    "biodata": ["eeg"],//基础服务,其他服务查阅官网：https://docs.affectivecloud.cn/%F0%9F%8E%99%E6%8E%A5%E5%8F%A3%E5%8D%8F%E8%AE%AE/4.%20%E7%94%9F%E7%89%A9%E6%95%B0%E6%8D%AE%E5%9F%BA%E7%A1%80%E5%88%86%E6%9E%90%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE.html#%E5%AE%9E%E6%97%B6%E7%94%9F%E7%89%A9%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E8%BF%94%E5%9B%9E%E5%80%BC
    "affective": ["attention"] //情感服务，其他服务参考查阅官网：https://docs.affectivecloud.cn/%F0%9F%8E%99%E6%8E%A5%E5%8F%A3%E5%8D%8F%E8%AE%AE/5.%20%E6%83%85%E6%84%9F%E8%AE%A1%E7%AE%97%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE.html#%E6%83%85%E6%84%9F%E4%BA%91%E8%AE%A1%E7%AE%97%E5%AE%9E%E6%97%B6%E8%BF%94%E5%9B%9E%E6%95%B0%E6%8D%AE%E6%9C%8D%E5%8A%A1%E5%92%8C%E5%8F%82%E6%95%B0%E9%A1%B9
  },
  "algorithm_params": {
    "eeg": {
      "tolerance": 2,
      "channel_power_verbose": true,
      "power_mode": "db", //代表脑波频谱数据返回的形式。 db:绝对值形式（分贝），rate:占比形式
      "filter_mode": "smart", // 滤波模式：basic,smart,hard 
    }
  }
}
var enterAffectiveCloudManager = plugin.obtainAffectiveCloudManager(config)
enterAffectiveCloudManager.init({
	"onSuccess": function () {
		console.log("情感云初始化成功")
	},
	"onError": function (error) {
		console.log("情感云初始化失败：", error)
	}
})
```

### 添加监听

#### 数据监听

```js
enterAffectiveCloudManager.addBiodataRealtimeListener(function (biodata) {
	console.log("实时基础数据:", JSON.stringify(biodata))
})
enterAffectiveCloudManager.addAffectiveDataRealtimeListener(function (affectiveData) {
	console.log("实时情感数据:", JSON.stringify(affectiveData))
})
```

#### 状态监听

```js
enterAffectiveCloudManager.addWebSocketConnectListener(function () {
	console.log("websocket连接成功")
})
enterAffectiveCloudManager.addWebSocketDisconnectListener(function (error) {
	console.log("websocket连接失败：", error)
})
```

### 上传数据

#### 上传脑波数据

```js
enterAffectiveCloudManager.appendEEGData(eeg)//输入格式为无符号整型数组，数组长度为20
```

#### 上传心率数据

```js
enterAffectiveCloudManager.appendHeartRateData(hr)//输入格式为整型
```

### 获取报表数据

```js
enterAffectiveCloudManager.getBiodataReport({
	"onSuccess": function (bioReport) {
		console.log("获取基础服务报表成功", JSON.stringify(bioReport))
	},
	"onError": function (error) {
		console.log("获取基础服务报表失败", error)
	}
})
enterAffectiveCloudManager.getAffectiveReport({
	"onSuccess": function (affectiveReport) {
		console.log("获取情感服务报表成功", JSON.stringify(affectiveReport))
	},
	"onError": function (error) {
		console.log("获取情感服务报表失败", error)
	}
})
```

### 重连接

当网络断开不超过10分可以通过重连接`restore`接口进行情感云的重连接，超过10分钟需要调用init重新初始化。

```js
enterAffectiveCloudManager.restore({
      "onSuccess": function () {
        console.log("情感云重连成功")
      },
      "onError": function (error) {
        console.log("情感云重连失败", error)
      }
    })
```

### 资源释放

注意，每次使用完情感云服务都需调用如下`release`方法来释放资源，否则会面临持续扣费的风险

```js
enterAffectiveCloudManager.release({
      "onSuccess": function () {
        console.log("情感云断开成功")
      },
      "onError": function (error) {
        console.log("情感云断开失败", error)
      }
    })
```





