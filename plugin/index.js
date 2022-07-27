var affectiveApi = require("/affective-cloud/enter-affective-cloud-api.js")
module.exports = {
  sayHello() {
    console.log('Hello plugin!')
  },
  connectToAffective(){
    affectiveApi.init("wss://server-test.affectivecloud.cn/ws/algorithm/v2/",10000,"015b7118-b81e-11e9-9ea1-8c8590cb54f9","cd9c757ae9a7b7e1cff01ee1bb4d4f98","wxtest",3)
    affectiveApi.openWebSocket(function(){
      affectiveApi.createSession({function () {
        
      },function (error) {
        
      }})
    },function(){

    })
  },
  answer: 42
}
