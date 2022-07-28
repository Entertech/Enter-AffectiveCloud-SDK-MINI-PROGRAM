import ResponseBody from "response-body.js"
var websocket_helper = require("../affective-cloud/websocket-helper.js")

var requestBody = {
  "services": null,
  "op": "",
  "kwargs": null,
  "args": null
}
var SERVER_SESSION = "session"
var SERVER_BIO_DATA = "biodata"
var SERVER_AFFECTIVE = "affective"
var OP_CREATE = "create"
var MD5 = require("../utils/MD5.js")
var mUrl = ""
var mTimeout = 10000
var mAppKey = ""
var mAppSecret = ""
var mUserId = ""
var mUploadCycle = 3
var mSign = null
var mCreateSessionCallback = null
var mSessionId = null
var messageReceiveLisetner = function (msg) {
  var responseObject = JSON.parse(msg)
  var response = new ResponseBody(responseObject)
  if (response.isCreateOp()) {
    if (response["code"] == 0) {
      mSessionId = response.getSessionId()
      mCreateSessionCallback.onSuccess(mSessionId)
    } else {
      mCreateSessionCallback.onError(response.errorBody())
    }
  }
  if (response.isRestoreOp()) {
    if (response["code"] == 0) {
      mRestoreCallback.onSuccess()
    } else {
      mRestoreCallback.onError(response.errorBody())
    }
  }
  if (response.isInitBiodataOp()) {
    if (response["code"] == 0) {
      mBiodataInitCallback.onSuccess()
    } else {
      mBiodataInitCallback.onError(response.errorBody())
    }
  }
  if (response.isSubmitOp()) {
    if (response["code"] == 0) {
      mSubmitCallback.onSuccess()
    } else {
      mSubmitCallback.onError(response.errorBody())
    }
  }
  if (response.isStartAffectiveOp()) {
    if (response["code"] == 0) {
      mAffectiveStartCallback.onSuccess()
    } else {
      mAffectiveStartCallback.onError(response.errorBody())
    }
  }
  if (response.isBiodataSubOp()) {
    if (response["code"] == 0) {
      mBiodataSubscribeCallback.onSuccess(response.body())
    } else {
      mBiodataSubscribeCallback.onError(response.errorBody())
    }
  }
  if (response.isAffectiveSubOp()) {
    if (response["code"] == 0) {
      mAffectiveSubscribeCallback.onSuccess(response.body())
    } else {
      mAffectiveSubscribeCallback.onError(response.errorBody())
    }
  }
  if (response.isBiodataUnsubOp()) {
    if (response["code"] == 0) {
      mBiodataUnsubscribeCallback.onSuccess(response.body())
    } else {
      mBiodataUnsubscribeCallback.onError(response.errorBody())
    }
  }
  if (response.isAffectiveUnsubOp()) {
    if (response["code"] == 0) {
      mAffectiveUnsubscribeCallback.onSuccess(response.body())
    } else {
      mAffectiveUnsubscribeCallback.onError(response.errorBody())
    }
  }
  if (response.isBiodataResponse()) {
    if (response["code"] == 0) {
      mBiodataResponseCallback.onSuccess(response.body())
    } else {
      mBiodataResponseCallback.onError(response.errorBody())
    }
  }
  if (response.isAffectivedataResponse()) {
    if (response["code"] == 0) {
      mAffectiveDataResponseCallback.onSuccess(response.body())
    } else {
      mAffectiveDataResponseCallback.onError(response.errorBody())
    }
  }
  if (response.isReportBiodata()) {
    if (response["code"] == 0) {
      mBiodataReportCallback.onSuccess(response.body())
    } else {
      mBiodataReportCallback.onError(response.errorBody())
    }
  }
  if (response.isReportAffective()) {
    if (response["code"] == 0) {
      mAffectiveReportCallback.onSuccess(response.body())
    } else {
      mAffectiveReportCallback.onError(response.errorBody())
    }
  }
  if (response.isAffectiveFinish()) {
    if (response["code"] == 0) {
      mAffectiveFinishCallback.onSuccess(response.body())
    } else {
      mAffectiveFinishCallback.onError(response.errorBody())
    }
  }
  if (response.isSessionClose()) {
    if (response["code"] == 0) {
      mWebSocketCloseCallback.onSuccess(response.body())
    } else {
      mWebSocketCloseCallback.onError(response.errorBody())
    }
  }
}

function init(url, timeout, appKey, appSecret, userId, uploadCycle) {
  mUrl = url
  mTimeout = timeout
  mAppKey = appKey
  mAppSecret = appSecret
  mUserId = userId
  mUploadCycle = uploadCycle
  websocket_helper.addMessageReceiveLisetenr(messageReceiveLisetner)
}

function openWebSocket(success, fail) {
  console.log("connecting", mUrl)
  websocket_helper.connect(mUrl, mTimeout, success, fail)
}

function closeWebSocket() {
  websocket_helper.closeWebSocket()
}

function isWebSocketOpen() {
  return websocket_helper.isOpen()
}

function createSession(callback) {
  if (mAppKey == null || mAppSecret == null || mUserId == null) {
    console.log("create socket fail")
    return
  } else {
    mCreateSessionCallback = callback
    var timestamp = Date.parse(new Date())
    var userIdEncoded = MD5.hexMD5(mUserId).toUpperCase()
    var md5Params = "app_key=" + mAppKey + "&app_secret=" + mAppSecret + "&timestamp=" + timestamp + "&user_id=" + userIdEncoded
    mSign = MD5.hexMD5(md5Params).toUpperCase()
    var kwargs = {
      "app_key": mAppKey,
      "sign": mSign,
      "user_id": userIdEncoded,
      "timestamp": timestamp,
      "upload_cycle": 3
    }
    requestBody["services"] = SERVER_SESSION
    requestBody["op"] = OP_CREATE
    requestBody["kwargs"] = kwargs
    websocket_helper.sendMessage(requestBody)
  }
}

module.exports.init = init
module.exports.openWebSocket = openWebSocket
module.exports.createSession = createSession