import ResponseBody from "response-body.js"
var websocket_helper = require("../affective-cloud/websocket-helper.js")

var requestBody = {
  "services": {},
  "op": "",
  "kwargs": {},
  "args": {}
}
var SERVER_SESSION = "session"
var SERVER_BIO_DATA = "biodata"
var SERVER_AFFECTIVE = "affective"
var OP_CREATE = "create"
var OP_RESTORE = "restore"
var MD5 = require("../utils/MD5.js")
var mUrl = ""
var mTimeout = 10000
var mAppKey = null
var mAppSecret = null
var mUserId = null
var mUploadCycle = 3
var mSign = null

var mCreateSessionCallback = null
var mRestoreCallback = null
var mBiodataInitCallback = null
var mAffectiveStartCallback = null
var mStartedAffectiveServices = null
var mBiodataResponseCallback = null
var mBiodataSubscribeCallback = null
var mAffectiveDataResponseCallback = null
var mAffectiveSubscribeCallback = null
var mBiodataReportCallback = null
var mAffectiveReportCallback = null
var mBiodataUnsubscribeCallback = null
var mAffectiveUnsubscribeCallback = null
var mAffectiveFinishCallback = null
var mWebSocketCloseCallback = null
var mSubmitCallback = null

var mSubscribeAffectiveData = null
var mSubscribeBioData = null
var mSessionId = null
var mBrainDataBuffer = []
var mHeartDataBuffer = new Array()
var mPeprDataBuffer = []
var mSCDataBuffer = []

var uploadEEGTriggerCount = 1800
var uploadHRTriggerCount = 6
var uploadPEPRTriggerCount = 45
var uploadSCTriggerCount = 1530

var DEFAULT_UPLOAD_EEG_PACKAGE_COUNT = 30
var DEFAULT_UPLOAD_HR_PACKAGE_COUNT = 2
var DEFAULT_UPLOAD_PEPR_PACKAGE_COUNT = 15
var BASE_UPLOAD_EEG_PACKAGE_COUNT = 50
var BASE_UPLOAD_HR_PACKAGE_COUNT = 3
var UPLOAD_SCEEG_PACKAGE_COUNT = 30
var UPLOAD_MCEEG_PACKAGE_COUNT = 30
var UPLOAD_BCG_PACKAGE_COUNT = 10
var UPLOAD_GYRO_PACKAGE_COUNT = 5
var EEG_PACKAGE_LENGTH = 20
var HR_PACKAGE_LENGTH = 1
var PEPR_PACKAGE_LENGTH = 15
var SC_PACKAGE_LENGTH = 17
var DEFAULT_UPLOAD_CYCLE = 3
var messageReceiveLisetner = function (msg) {
  // console.log("receive msg:", msg)
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
  if (response.isAffectiveDataResponse()) {
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
  if (response.isSessionClose() && mWebSocketCloseCallback != null) {
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

  uploadEEGTriggerCount = BASE_UPLOAD_EEG_PACKAGE_COUNT * EEG_PACKAGE_LENGTH * mUploadCycle
  uploadHRTriggerCount = BASE_UPLOAD_HR_PACKAGE_COUNT * HR_PACKAGE_LENGTH * mUploadCycle
  uploadPEPRTriggerCount = DEFAULT_UPLOAD_PEPR_PACKAGE_COUNT * PEPR_PACKAGE_LENGTH * mUploadCycle
  uploadSCTriggerCount = UPLOAD_SCEEG_PACKAGE_COUNT * SC_PACKAGE_LENGTH * mUploadCycle
  websocket_helper.addRawJsonResponseListener(messageReceiveLisetner)
}

function openWebSocket(success, fail) {
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
      "upload_cycle": mUploadCycle
    }
    requestBody["services"] = SERVER_SESSION
    requestBody["op"] = OP_CREATE
    requestBody["args"] = null
    requestBody["kwargs"] = kwargs
    websocket_helper.sendMessage(requestBody)
  }
}

function isSessionCreated() {
  return mSessionId != null && mSign != null
}

function getSessionId() {
  return mSessionId
}

function sendRestore() {
  if (mAppKey == null || mAppSecret == null || mUserId == null) {
    console.log("create socket fail")
    return
  } else {
    var timestamp = Date.parse(new Date())
    var userIdEncoded = MD5.hexMD5(mUserId).toUpperCase()
    var md5Params = "app_key=" + mAppKey + "&app_secret=" + mAppSecret + "&timestamp=" + timestamp + "&user_id=" + userIdEncoded
    mSign = MD5.hexMD5(md5Params).toUpperCase()
    var kwargs = {
      "app_key": mAppKey,
      "sign": mSign,
      "user_id": userIdEncoded,
      "timestamp": timestamp,
      "upload_cycle": mUploadCycle,
      "session_id": mSessionId
    }
    requestBody["services"] = SERVER_SESSION
    requestBody["op"] = OP_RESTORE
    requestBody["kwargs"] = kwargs
    requestBody["args"] = null
    websocket_helper.sendMessage(requestBody)
  }
}

function restore(callback) {
  mRestoreCallback = callback
  if (!isSessionCreated()) {
    console.log("session is not exit,restore is not illegal")
    return
  }
  if (isWebSocketOpen()) {
    sendRestore()
  } else {
    openWebSocket(function () {
      sendRestore()
    }, function (error) {
      callback.onError(error)
    })
  }
}

function initBiodataServices(serviceList, callback) {
  mBiodataInitCallback = callback
  let kwargs = {
    "bio_data_type": serviceList
  }
  var requestBody = {
    "services": {},
    "op": "",
    "kwargs": {},
  }
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "init"
  requestBody["kwargs"] = kwargs
  websocket_helper.sendMessage(requestBody)
}

function initBiodataServicesWithParams(serviceList, callback, optionParams) {
  mBiodataInitCallback = callback
  var kwargs = {
    "bio_data_type": serviceList
  }
  if (optionParams != null) {
    Object.assign(kwargs, optionParams)
  }

  var requestBody = {
    "services": {},
    "op": "",
    "kwargs": {},
  }
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "init"
  requestBody["kwargs"] = kwargs
  
  websocket_helper.sendMessage(requestBody)
}

function initAffectiveDataServices(services, callback, optionParams) {
  mAffectiveStartCallback = callback
  mStartedAffectiveServices = services
  var kwargs = {
    "cloud_services": services,
  }
  if (optionParams != null) {
    Object.assign(kwargs, optionParams)
  }

  var requestBody = {
    "services": {},
    "op": "",
    "kwargs": {},
  }
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "start"
  requestBody["kwargs"] = kwargs
  
  websocket_helper.sendMessage(requestBody)
}

function appendSCEEGData(brainData) {
  mSCDataBuffer = mSCDataBuffer.concat(brainData)
  if (mSCDataBuffer.length >= uploadSCTriggerCount) {
    var kwargs = {
      "sceeg": mSCDataBuffer
    }
    var requestBody = {
      "services": {},
      "op": "",
      "kwargs": {},
    }
    requestBody["services"] = SERVER_BIO_DATA
    requestBody["op"] = "upload"
    requestBody["kwargs"] = kwargs
    websocket_helper.sendMessage(requestBody)
    mSCDataBuffer = []
  }
}

function appendEEGData(brainData) {
  mBrainDataBuffer = mBrainDataBuffer.concat(brainData)
  if (mBrainDataBuffer.length >= uploadEEGTriggerCount) {
    var kwargs = {
      "eeg": mBrainDataBuffer
    }
    var requestBody = {
      "services": {},
      "op": "",
      "kwargs": {},
    }
    requestBody["services"] = SERVER_BIO_DATA
    requestBody["op"] = "upload"
    requestBody["kwargs"] = kwargs
    websocket_helper.sendMessage(requestBody)
    mBrainDataBuffer = []
  }
}

function appendHeartData(heartRateData) {
  mHeartDataBuffer.push(heartRateData)
  if (mHeartDataBuffer.length >= uploadHRTriggerCount) {

    var requestBody = {
      "services": {},
      "op": "",
      "kwargs": {},
    }
    var kwargs = {
      "hr-v2": mHeartDataBuffer
    }
    requestBody["services"] = SERVER_BIO_DATA
    requestBody["op"] = "upload"
    requestBody["kwargs"] = kwargs
    websocket_helper.sendMessage(requestBody)
    mHeartDataBuffer = []
  }
}

function appendPEPRData(peprData) {
  mPeprDataBuffer = mPeprDataBuffer.push(peprData)
  if (mPeprDataBuffer.length >= uploadPEPRTriggerCount) {
    var kwargs = {
      "pepr": mHeartDataBuffer
    }
    requestBody["services"] = SERVER_BIO_DATA
    requestBody["op"] = "upload"
    requestBody["kwargs"] = kwargs
    requestBody["args"] = null
    websocket_helper.sendMessage(requestBody)
    mPeprDataBuffer = []
  }
}

function subscribeBioData(optionalParams, response, callback) {
  mBiodataResponseCallback = response
  mBiodataSubscribeCallback = callback
  mSubscribeBioData = optionalParams

  var requestBody = {
    "services": {},
    "op": "",
    "args": {},
  }
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "subscribe"
  requestBody["args"] = optionalParams
  websocket_helper.sendMessage(requestBody)
}

function addBioDataCallback(callback) {
  mBiodataResponseCallback = callback
}

function addAffectiveDataCallback(callback) {
  mAffectiveDataResponseCallback = callback
}

function subscribeAffectiveData(optionalParams, response, callback) {
  mAffectiveDataResponseCallback = response
  mAffectiveSubscribeCallback = callback
  mSubscribeAffectiveData = optionalParams
  var requestBody = {
    "services": {},
    "op": "",
    "args": {},
  }
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "subscribe"
  requestBody["args"] = optionalParams
  websocket_helper.sendMessage(requestBody)
}

function getBiodataReport(services, callback) {
  mBiodataReportCallback = callback
  var requestBodyMap = {
    "bio_data_type": services
  }
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "report"
  requestBody["kwargs"] = requestBodyMap
  websocket_helper.sendMessage(requestBody)
}

function getAffectiveDataReport(services, callback) {
  mAffectiveReportCallback = callback
  var requestBodyMap = {
    "cloud_services": services
  }
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "report"
  requestBody["kwargs"] = requestBodyMap
  websocket_helper.sendMessage(requestBody)
}

function unsubscribeBioData(optionalParams, callback) {
  mBiodataUnsubscribeCallback = callback
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "unsubscribe"
  requestBody["kwargs"] = null
  requestBody["args"] = optionalParams
  websocket_helper.sendMessage(requestBody)
}

function unsubscribeAffectiveData(optionalParams, callback) {
  mAffectiveUnsubscribeCallback = callback
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "unsubscribe"
  requestBody["kwargs"] = null
  requestBody["args"] = optionalParams
  websocket_helper.sendMessage(requestBody)
}

function finishAffectiveDataServices(services, callback) {
  mAffectiveFinishCallback = callback
  var requestBodyMap = {
    "cloud_services": services
  }
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "finish"
  requestBody["kwargs"] = requestBodyMap
  websocket_helper.sendMessage(requestBody)
}

function finishAllAffectiveDataServices(callback) {
  finishAffectiveDataServices(mStartedAffectiveServices, callback)
}

function destroySessionAndCloseWebSocket(callback) {
  mWebSocketCloseCallback = callback
  requestBody["services"] = SERVER_SESSION
  requestBody["op"] = "close"
  requestBody["kwargs"] = {}
  websocket_helper.sendMessage(requestBody)
}

function submit(remark, callback) {
  mSubmitCallback = callback
  var requestBodyMap = {
    "rec": remark
  }
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "submit"
  requestBody["kwargs"] = requestBodyMap
  websocket_helper.sendMessage(requestBody)
}

function addRawJsonRequestListener(listener) {
  websocket_helper.addRawJsonRequestListener(listener)
}

function addRawJsonResponseListener(listener) {
  websocket_helper.addRawJsonResponseListener(listener)
}

function addConnectListener(listener) {
  websocket_helper.addConnectListener(listener)
}

function addDisconnectListener(listener) {
  websocket_helper.addDisconnectListener(listener)
}
module.exports.init = init
module.exports.openWebSocket = openWebSocket
module.exports.createSession = createSession
module.exports.isSessionCreated = isSessionCreated
module.exports.getSessionId = getSessionId
module.exports.restore = restore
module.exports.initBiodataServices = initBiodataServices
module.exports.initBiodataServicesWithParams = initBiodataServicesWithParams
module.exports.initAffectiveDataServices = initAffectiveDataServices
module.exports.appendEEGData = appendEEGData
module.exports.appendSCEEGData = appendSCEEGData
module.exports.appendHeartData = appendHeartData
module.exports.appendPEPRData = appendPEPRData
module.exports.subscribeBioData = subscribeBioData
module.exports.subscribeAffectiveData = subscribeAffectiveData
module.exports.getBiodataReport = getBiodataReport
module.exports.getAffectiveDataReport = getAffectiveDataReport
module.exports.unsubscribeBioData = unsubscribeBioData
module.exports.unsubscribeAffectiveData = unsubscribeAffectiveData
module.exports.finishAffectiveDataServices = finishAffectiveDataServices
module.exports.finishAllAffectiveDataServices = finishAllAffectiveDataServices
module.exports.destroySessionAndCloseWebSocket = destroySessionAndCloseWebSocket
module.exports.submit = submit
module.exports.addRawJsonRequestListener = addRawJsonRequestListener
module.exports.addRawJsonResponseListener = addRawJsonResponseListener
module.exports.addConnectListener = addConnectListener
module.exports.addDisconnectListener = addDisconnectListener
module.exports.closeWebSocket = closeWebSocket
module.exports.isWebSocketOpen = isWebSocketOpen