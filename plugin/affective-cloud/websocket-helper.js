var pako = require("../utils/pako.js")
var isWebSocketOpen = false
var task = null
var rawJsonRequestListeners = new Array()
var rawJsonResponseListeners = new Array() 
var connectListeners = new Array()
var disconnectListeners = new Array()

function connect(cloudUrl, timeout = 10000, connectSuccess, connectFailed) {
  task = wx.connectSocket({
    url: cloudUrl,
    timeout: timeout,
    success:function(res){
    },
    fail: function (error) {//打开连接失败
    }
  })
  task.onClose((code,reason)=>{
    if(disconnectListeners != null){
      for(var i in disconnectListeners){
        disconnectListeners[i](code,reason)
      }
    }
  })
  task.onOpen((res)=>{
    isWebSocketOpen = true
    connectSuccess(res)
    if(connectListeners != null){
      for(var i in connectListeners){
        connectListeners[i]()
      }
    }
  })
  task.onError((res)=>{
    isWebSocketOpen = false
    connectFailed(res)
  })
  task.onMessage((msg)=>{
    var data = pako.inflate(msg.data)
    var  string= String.fromCharCode.apply(null, new Uint8Array(data));
    if (rawJsonResponseListeners != null) {
      for(var i in rawJsonResponseListeners){
        rawJsonResponseListeners[i](string)
      }
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
    if(rawJsonRequestListeners != null){
      for(var i in rawJsonRequestListeners){
        rawJsonRequestListeners[i](JSON.stringify(msg))
      }
    }
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
  rawJsonRequestListeners.push(listener)
}

function addRawJsonResponseListener(listener) {
  rawJsonResponseListeners.push(listener)
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