var pako = require("../utils/pako.js")
var isWebSocketOpen = false
var task = null
var messageReceiveListener = null

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
    console.log("close")
  })
  task.onOpen((res)=>{
    isWebSocketOpen = true
    connectSuccess(res)
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
      messageReceiveListener(string)
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

function addMessageReceiveLisetenr(listener) {
  messageReceiveListener = listener
}

function sendMessage(msg) {
  if (task != null && isWebSocketOpen) {
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
module.exports.closeWebSocket = closeWebSocket
module.exports.isOpen = isOpen
module.exports.connect = connect
module.exports.addMessageReceiveLisetenr = addMessageReceiveLisetenr
module.exports.sendMessage = sendMessage