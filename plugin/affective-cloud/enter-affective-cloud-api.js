
var websocket_helper = require("../affective-cloud/websocket-helper.js")

var requestBody = {"services":null,"op":"","kwargs":null,"args":null}
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
var createSessionCallback = null
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
    createSessionCallback = callback
    var timestamp = Date.parse(new Date())
    var userIdEncoded = MD5.hexMD5(mUserId).toUpperCase()
    var md5Params = "app_key="+mAppKey+"&app_secret="+mAppSecret+"&timestamp="+timestamp+"&user_id="+userIdEncoded
    mSign = MD5.hexMD5(md5Params).toUpperCase()
    var kwargs = {"app_key":mAppKey,"sign":mSign,"user_id":userIdEncoded,"timestamp":timestamp,"upload_cycle":3}
    requestBody["services"] = SERVER_SESSION
    requestBody["op"] = OP_CREATE
    requestBody["kwargs"] = kwargs
    websocket_helper.sendMessage(requestBody)
  }
}

module.exports.init = init
module.exports.openWebSocket = openWebSocket
module.exports.createSession = createSession