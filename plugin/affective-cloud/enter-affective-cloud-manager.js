var affective_cloud_api = require("enter-affective-cloud-api.js")

var config = {
  "session": {
    "url": null,
    "timeout": null,
    "app_key": null,
    "app_secret": null,
    "user_id": null,
    "upload_cycle": null
  },
  "services": {
    "biodata": ["eeg", "hr"],
    "affective": ["attention"]
  },
  "subscribe": {
    "biodata": {
      "eeg": ["eegr_wave", "eegl_wave"],
      "hr": ["hr", "hrv"]
    },
    "affective": {
      "attention": ["attention"]
    }
  },
  "algorithm_params": {
    "eeg": {
      "tolerance": 2,
      "channel_power_verbose": true,
      "power_mode": "db", // db:分贝，rate:占比
      "filter_mode": "smart", // basic,smart,hard
    },
    "storage_settings": {
      "sex": "m", //m,f,o
      "age": 13,
      "channel_num": 2, //1-8
      "sn": "", // 设备编号
      "source": "",
      "mode": [],
      "case": [],
      "allow": true //是否存储数据
    }
  },
  "affective_params": {
    "sleep": { // 睡眠算法参数
      "eeg_power_output" : true, //是否输出各脑波能量。可选择输出全程各脑波能量变化曲线，该曲线与睡眠曲线长度一致，便于绘图处理。
      "sleep_stage_output" : true, //是否输出睡眠分期。可选择输出全程睡眠分期。
      "advanced_analysis" : true //是否进行进阶分析。进阶分析包括睡眠过程中的体动、觉醒输出以及睡眠抗干扰能力等指标。
    }
  }
}
export default class EnterAffectiveCloudManager {
  constructor(config) {
    this.config = config
    var timeout = null
    var uploadCycle = 3
    if (config["session"]["timeout"] == null) {
      timeout = 10000
    } else {
      timeout = config["session"]["timeout"]
    }
    if (config["session"]["upload_cycle"] != null) {
      uploadCycle = config["session"]["upload_cycle"]
    }
    affective_cloud_api.init(config["session"]["url"], timeout, config["session"]["app_key"], config["session"]["app_secret"], config["session"]["user_id"], uploadCycle)
  }

  openWebSocket(success, fail) {
    affective_cloud_api.openWebSocket(success, fail)
  }

  initBiodata(callback) {
    if (this.config["services"]["biodata"] == null) {
      callback.onError({
        "code": -1,
        "msg": "no biodata services in config"
      })
      return
    }
    var that = this
    var optionsMap = {
      "storage_settings": this.config["storage_settings"],
      "algorithm_params": this.config["algorithm_params"]
    }
    affective_cloud_api.initBiodataServicesWithParams(that.config["services"]["biodata"], {
      "onSuccess": function () {
        that.isInit = true
        affective_cloud_api.subscribeBioData(that.config["services"]["biodata"], {
          "onSuccess": function (biodata) {
            if (that.mBiodataRealtimeListener != null) {
              that.mBiodataRealtimeListener(biodata)
            }
          },
          "onError": function (error) {
            callback.onError(error)
          }
        }, {
          "onSuccess": function (subFields) {
            callback.onSuccess()
          },
          "onError": function (error) {
            callback.onError(error)
          }
        })
      },
      onError: function (error) {
        that.isInit = false
        callback.onError(error)
      }
    }, optionsMap)
  }

  initAffective(callback) {
    var that = this
    var optionsMap = {
      "algorithm_params": this.config["affective_params"]
    }
    var affectiveServices = this.config["services"]["affective"]
    affective_cloud_api.initAffectiveDataServices(affectiveServices, {
      "onSuccess": function () {
        affective_cloud_api.subscribeAffectiveData(affectiveServices, {
          "onSuccess": function (affectiveData) {
            if (that.mAffectiveRealtimeListener != null) {
              that.mAffectiveRealtimeListener(affectiveData)
            }
          },
          "onError": function (error) {
            callback.onError(error)
          }
        }, {
          "onSuccess": function (subFields) {
            callback.onSuccess()
          },
          "onError": function (error) {
            callback.onError(error)
          }
        })
      },
      "onError": function (error) {
        callback.onError(error)
      }
    }, optionsMap)
  }
  isInited() {
    return this.isInit
  }

  init(callback) {
    var that = this
    affective_cloud_api.openWebSocket(function () {
      affective_cloud_api.createSession({
        "onSuccess": function (sessionId) {
          that.initBiodata({
            "onSuccess": function () {
              if (that.config["services"]["affective"] != null) {
                that.initAffective(callback)
              } else {
                callback.onSuccess()
              }
            },
            "onError": function (error) {
              callback.onError(error)
            }
          })
        },
        "onError": function (error) {
          callback.onError(error)
          that.isInit = false
        }
      })
    }, function (error) {
      that.isInit = false
      callback.onError(error)
    })
  }
  restore(callback) {
    var that = this
    if (affective_cloud_api.isWebSocketOpen()) {
      affective_cloud_api.restore({
        "onSuccess": function () {
          that.initBiodata({
            "onSuccess": function () {
              if (that.config["services"]["affective"] != null) {
                that.initAffective(callback)
              } else {
                callback.onSuccess()
              }
            },
            "onError": function (error) {
              callback.onError(error)
            }
          })
        },
        "onError": function (error) {
          callback.onError(error)
          that.isInit = false
        }
      })
    } else {
      affective_cloud_api.openWebSocket(function () {
        affective_cloud_api.restore({
          "onSuccess": function () {
            that.initBiodata({
              "onSuccess": function () {
                if (that.config["services"]["affective"] != null) {
                  that.initAffective(callback)
                } else {
                  callback.onSuccess()
                }
              },
              "onError": function (error) {
                callback.onError(error)
              }
            })
          },
          "onError": function (error) {
            callback.onError(error)
            that.isInit = false
          }
        })
      }, function (error) {
        that.isInit = false
        callback.onError(error)
      })
    }
  }

  release(callback) {
    var affectiveServices = this.config["services"]["affective"]
    if (affectiveServices != null) {
      affective_cloud_api.finishAffectiveDataServices(affectiveServices, {
        "onSuccess": function () {
          affective_cloud_api.destroySessionAndCloseWebSocket({
            "onSuccess": function () {
              callback.onSuccess()
            },
            "onError": function (error) {
              callback.onError(error)
            }
          })
        },
        "onError": function (error) {
          callback.onError(error)
        }
      })
    } else {
      callback.onSuccess()
    }
  }

  getBiodataReport(callback) {
    var biodataServices = this.config["services"]["biodata"]
    affective_cloud_api.getBiodataReport(biodataServices, callback)
  }
  getAffectiveReport(callback) {
    var affectiveServices = this.config["services"]["affective"]
    affective_cloud_api.getAffectiveDataReport(affectiveServices, callback)
  }
  submit(remark, callback) {
    affective_cloud_api.submit(remark, callback)
  }
  appendPEPRData(pepr) {
    affective_cloud_api.appendPEPRData(pepr)
  }
  appendEEGData(eeg) {
    affective_cloud_api.appendEEGData(eeg)
  }
  appendHeartRateData(hr) {
    affective_cloud_api.appendHeartData(hr)
  }
  appendSCEEGData(sc) {
    affective_cloud_api.appendSCEEGData(sc)
  }
  addBiodataRealtimeListener(listener) {
    this.mBiodataRealtimeListener = listener
  }
  addAffectiveDataRealtimeListener(listener) {
    this.mAffectiveRealtimeListener = listener
  }
  addWebSocketConnectListener(listener) {
    affective_cloud_api.addConnectListener(listener)
  }
  addWebSocketDisconnectListener(listener) {
    affective_cloud_api.addDisconnectListener(listener)
  }
  addRawJsonRequestListener(listener) {
    affective_cloud_api.addRawJsonRequestListener(listener)
  }
  addRawJsonResponseListener(listener) {
    affective_cloud_api.addRawJsonResponseListener(listener)
  }

  closeWebSocket() {
    affective_cloud_api.closeWebSocket()
  }

  isWebSocketOpen() {
    return affective_cloud_api.isOpen()
  }
}