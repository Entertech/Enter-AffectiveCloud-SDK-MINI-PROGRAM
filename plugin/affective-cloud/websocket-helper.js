var pako = require("../utils/pako.js")
var isWebSocketOpen = false
var task = null
var rawJsonRequestListener = null
var rawJsonResponseListener = null
var connectListener = null
var disconnectListener = null

function connect(cloudUrl, timeout = 10000, connectSuccess, connectFailed) {
  console.log("url",cloudUrl)
  task = wx.connectSocket({
    url: cloudUrl,
    timeout: timeout,
    success:function(res){
      console.log("success")
    },
    fail: function (resConnectError) {//打开连接失败
      console.log(resConnectError)
    }
  })
  task.onClose((code,reason)=>{
    if(disconnectListener != null){
      disconnectListener(code,reason)
    }
  })
  task.onOpen((res)=>{
    isWebSocketOpen = true
    connectSuccess(res)
    if(connectListener != null){
      connectListener()
    }
  })
  task.onError((res)=>{
    isWebSocketOpen = false
    connectFailed(result)
  })
  task.onMessage((msg)=>{
    console.log("on message",msg)
    var data = pako.inflate(msg.data)
    var  string= String.fromCharCode.apply(null, new Uint8Array(data));
    if (messageReceiveListener != null) {
      rawJsonResponseListener(string)
    }
  })
  // wx.onSocketClose(function (res) {

  // })
  // wx.onSocketError((result) => {
  //   isWebSocketOpen = false
  //   connectFailed(result)
  // })
  // wx.onSocketOpen((result) => {
  //   isWebSocketOpen = true
  //   connectSuccess(result)
  // })
  // wx.onSocketMessage((result) => {
  //   if (messageReceiveListener != null) {
  //     messageReceiveListener(gzip_util.decode(result))
  //   }
  // })
}


function sendMessage(msg) {
  if (task != null && isWebSocketOpen) {
    rawJsonRequestListener(JSON.stringify(msg))
    var data = pako.gzip(JSON.stringify(msg))
    task.send({data:data.buffer})
  }
}

function isOpen() {
  return isWebSocketOpen
}

function closeWebSocket() {
  task.close()
}

function addRawJsonRequestListener(listener) {
  rawJsonRequestListener
}

function addRawJsonResponseListener(listener) {
  rawJsonResponseListener = listener
}
function addConnectListener(listener) {
  connectListener = listener
}

function addDisconnectListener(listener) {
  disconnectListener = listener
}
module.exports.closeWebSocket = closeWebSocket
module.exports.isOpen = isOpen
module.exports.connect = connect
module.exports.sendMessage = sendMessage
module.exports.addRawJsonRequestListener = addRawJsonRequestListener
module.exports.addRawJsonResponseListener = addRawJsonResponseListener
module.exports.addConnectListener = addConnectListener
module.exports.addDisconnectListener = addDisconnectListener