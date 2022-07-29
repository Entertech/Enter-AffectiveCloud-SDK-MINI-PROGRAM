import EnterAffectiveCloudManager from "/affective-cloud/enter-affective-cloud-manager.js"
module.exports = {
  obtainAffectiveCloudManager(config){
    return new EnterAffectiveCloudManager(config)
  }
}
