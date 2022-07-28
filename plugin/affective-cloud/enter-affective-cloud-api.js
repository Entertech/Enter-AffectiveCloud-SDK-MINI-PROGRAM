
var websocket_helper = require("../affective-cloud/websocket-helper.js")


var requestBody = {"services":null,"op":"","kwargs":null,"args":null}
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
var mHeartDataBuffer = []
var mPeprDataBuffer = []

var uploadEEGTriggerCount = 1800
var uploadHRTriggerCount = 6
var uploadPEPRTriggerCount = 45


var DEFAULT_UPLOAD_EEG_PACKAGE_COUNT = 30
var DEFAULT_UPLOAD_HR_PACKAGE_COUNT = 2
var DEFAULT_UPLOAD_PEPR_PACKAGE_COUNT = 15
var BASE_UPLOAD_EEG_PACKAGE_COUNT = 50
var BASE_UPLOAD_HR_PACKAGE_COUNT = 3
var UPLOAD_MCEEG_PACKAGE_COUNT = 30
var UPLOAD_BCG_PACKAGE_COUNT = 10
var UPLOAD_GYRO_PACKAGE_COUNT = 5
var EEG_PACKAGE_LENGTH = 20
var HR_PACKAGE_LENGTH = 1
var PEPR_PACKAGE_LENGTH = 15
var DEFAULT_UPLOAD_CYCLE = 3

var messageReceiveLisetner = function(msg){
  console.log("receive msg:",msg);
}
function init(url,timeout,appKey,appSecret,userId,uploadCycle){
  mUrl = url
  mTimeout = timeout
  mAppKey = appKey
  mAppSecret = appSecret
  mUserId = userId
  mUploadCycle = uploadCycle

  uploadEEGTriggerCount = DEFAULT_UPLOAD_EEG_PACKAGE_COUNT*EEG_PACKAGE_LENGTH*uploadCycle
  uploadHRTriggerCount = DEFAULT_UPLOAD_HR_PACKAGE_COUNT*HR_PACKAGE_LENGTH*uploadCycle
  uploadPEPRTriggerCount = DEFAULT_UPLOAD_PEPR_PACKAGE_COUNT*PEPR_PACKAGE_LENGTH*uploadCycle

  websocket_helper.addMessageReceiveLisetenr(messageReceiveLisetner)
}

function openWebSocket(success,fail){
  console.log("connecting",mUrl)
  websocket_helper.connect(mUrl,mTimeout,success,fail)
}

function closeWebSocket(){
  websocket_helper.closeWebSocket()
}
function isWebSocketOpen(){
  return websocket_helper.isOpen()
}

function createSession(callback){
  if(mAppKey == null || mAppSecret == null || mUserId == null){
    console.log("create socket fail")
    return
  }else{
    mCreateSessionCallback = callback
    var timestamp = Date.parse(new Date())
    var userIdEncoded = MD5.hexMD5(mUserId).toUpperCase()
    var md5Params = "app_key="+mAppKey+"&app_secret="+mAppSecret+"&timestamp="+timestamp+"&user_id="+userIdEncoded
    mSign = MD5.hexMD5(md5Params).toUpperCase()
    var kwargs = {"app_key":mAppKey,"sign":mSign,"user_id":userIdEncoded,"timestamp":timestamp,"upload_cycle":3}
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
    var md5Params = "app_key="+mAppKey+"&app_secret="+mAppSecret+"&timestamp="+timestamp+"&user_id="+userIdEncoded
    mSign = MD5.hexMD5(md5Params).toUpperCase()
    var kwargs = {"app_key":mAppKey,"sign":mSign,"user_id":userIdEncoded,"timestamp":timestamp,"upload_cycle":3, "session_id":mSessionId}
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
    openWebSocket(function() {
      sendRestore()
    }, function(error) {
      callback.onError(error)
    })
  }
}

function initBiodataServices(serviceList, callback) {
  mBiodataInitCallback = callback
  let kwargs = {"bio_data_type":serviceList}
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "init"
  requestBody["kwargs"] = kwargs
  requestBody["args"] = null
  websocket_helper.sendMessage(requestBody)
}

function initBiodataServicesWithParams(serviceList, callback, optionParams) {
  mBiodataInitCallback = callback
  var kwargs = {"bio_data_type":serviceList}
  if (optionParams != null) {
    Object.assign(kwargs, optionParams)
  }
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "init"
  requestBody["kwargs"] = kwargs
  requestBody["args"] = null
  websocket_helper.sendMessage(requestBody)
}

function initAffectiveDataServices(services, callback) {
  mAffectiveStartCallback = callback
  mStartedAffectiveServices = services
  var kwargs = {"cloud_services": services}
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "start"
  requestBody["kwargs"] = kwargs
  requestBody["args"] = null
  websocket_helper.sendMessage(requestBody)
}

function appendEEGData(brainData) {
  mBrainDataBuffer = mBrainDataBuffer.concat(brainData)
  if (mBrainDataBuffer.length >= uploadEEGTriggerCount) {
    var kwargs = {"eeg":mBrainDataBuffer}
    requestBody["services"] = SERVER_BIO_DATA
    requestBody["op"] = "upload"
    requestBody["kwargs"] = kwargs
    requestBody["args"] = null
    websocket_helper.sendMessage(requestBody)
    mBrainDataBuffer = []
  }
}

function appendHeartData(heartRateData) {
  mHeartDataBuffer = mHeartDataBuffer.push(heartRateData)
  if (mHeartDataBuffer.length >= uploadHRTriggerCount) {
    var kwargs = {"hr-v2":mHeartDataBuffer}
    requestBody["services"] = SERVER_BIO_DATA
    requestBody["op"] = "upload"
    requestBody["kwargs"] = kwargs
    requestBody["args"] = null
    websocket_helper.sendMessage(requestBody)
    mHeartDataBuffer = []
  }
}

function appendPEPRData(peprData) {
  mPeprDataBuffer = mPeprDataBuffer.push(peprData)
  if (mPeprDataBuffer.length >= uploadPEPRTriggerCount) {
    var kwargs = {"pepr":mHeartDataBuffer}
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
  requestBody["services"] = SERVER_BIO_DATA
  requestBody["op"] = "subscribe"
  requestBody["kwargs"] = null
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
  requestBody["services"] = SERVER_AFFECTIVE
  requestBody["op"] = "subscribe"
  requestBody["kwargs"] = null
  requestBody["args"] = optionalParams
  websocket_helper.sendMessage(requestBody)
}



module.exports.init = init
module.exports.openWebSocket = openWebSocket
module.exports.createSession = createSession