var response = {
  "code": null,
  "request": null,
  "data": "null",
  "msg": null
}
var REQUEST_SERVICES_SESSION = "session"
var REQUEST_SERVICES_BIODATA = "biodata"
var REQUEST_SERVICES_AFFECTIVE = "affective"

var REQUEST_OPTION_SESSION_CREATE = "create"
var REQUEST_OPTION_SESSION_CLOSE = "close"
var REQUEST_OPTION_SESSION_RESTORE = "restore"

var REQUEST_OPTION_SUBSCRIBE = "subscribe"
var REQUEST_OPTION_UNSUBSCRIBE = "unsubscribe"

var REQUEST_OPTION_BIODATA_INIT = "init"
var REQUEST_OPTION_BIODATA_UPLOAD = "upload"
var REQUEST_OPTION_BIODATA_REPORT = "report"

var REQUEST_OPTION_AFFECTIVE_START = "start"
var REQUEST_OPTION_AFFECTIVE_REPORT = "report"
var REQUEST_OPTION_AFFECTIVE_FINISH = "finish"

var REQUEST_OPTION_SUBMIT = "submit"
export default class ResponseBody {
  constructor(object) {
    for (var prop in object) {
      this[prop] = object[prop]
    }
  }
  isCreateOp() {
    return this.request["op"] == REQUEST_OPTION_SESSION_CREATE
  }
  isRestoreOp() {
    return this.request["op"] == REQUEST_OPTION_SESSION_RESTORE
  }
  isInitBiodataOp() {
    return this.request["op"] == REQUEST_OPTION_BIODATA_INIT
  }

  isStartAffectiveOp() {
    return this.request["op"] == REQUEST_OPTION_AFFECTIVE_START
  }

  isSubmitOp() {
    return this.request["op"] == REQUEST_OPTION_SUBMIT
  }

  isBiodataSubOp() {
    if (this.request["op"] == REQUEST_OPTION_SUBSCRIBE && this.request["services"] == REQUEST_SERVICES_BIODATA) {
      for (var prop in this.data) {
        if (prop.search("fields")) {
          return true
        }
      }
    }
    return false
  }

  isAffectiveSubOp() {
    if (this.request["op"] == REQUEST_OPTION_SUBSCRIBE && this.request["services"] == REQUEST_SERVICES_AFFECTIVE) {
      for (var prop in this.data) {
        if (prop.search("fields")) {
          return true
        }
      }
    }
    return false
  }
  isBiodataUnsubOp() {
    if (this.request["op"] == REQUEST_OPTION_UNSUBSCRIBE && this.request["services"] == REQUEST_SERVICES_BIODATA) {
      for (var prop in this.data) {
        if (prop == "fields") {
          return true
        }
      }
    }
    return false
  }

  isAffectiveUnsubOp() {
    if (this.request["op"] == REQUEST_OPTION_UNSUBSCRIBE && this.request["services"] == REQUEST_SERVICES_AFFECTIVE) {
      for (var prop in this.data) {
        if (prop == "fields") {
          return true
        }
      }
    }
    return false
  }

  isBiodataResponse() {
    var result = true
    if (this.request["op"] == REQUEST_OPTION_SUBSCRIBE && this.request["services" == REQUEST_SERVICES_BIODATA]) {
      for (var prop in this.data) {
        if (prop == "fields") {
          result = false
        }
      }
      return result
    } else {
      return false
    }
  }

  isAffectiveDataResponse() {
    var result = true
    if (this.request["op"] == REQUEST_OPTION_SUBSCRIBE && this.request["services" == REQUEST_SERVICES_AFFECTIVE]) {
      for (var prop in this.data) {
        if (prop == "fields") {
          result = false
        }
      }
      return result
    } else {
      return false
    }
  }
  isReportBiodata() {
    return this.request["op"] == REQUEST_OPTION_BIODATA_REPORT && this.request["services"] == REQUEST_SERVICES_BIODATA
  }

  isReportAffective() {
    return this.request["op"] == REQUEST_OPTION_AFFECTIVE_REPORT && this.request["services"] == REQUEST_SERVICES_AFFECTIVE
  }

  isAffectiveFinish() {
    return this.request["op"] == REQUEST_OPTION_AFFECTIVE_FINISH && this.request["services"] == REQUEST_SERVICES_AFFECTIVE
  }

  isSessionClose() {
    return this.request["op"] == REQUEST_OPTION_SESSION_CLOSE && this.request["services"] == REQUEST_SERVICES_SESSION
  }
  isServicesUnknow(){
    return this.request["services"] == "Unknow"
  }
  getSessionId(){
    if(this.request["op"] == REQUEST_OPTION_SESSION_CREATE){
      if(this.data.hasOwnProperty("session_id")){
        return this.data["session_id"]
      }
    }
    return null
  }
  errorBody(){
    return {"code":this.code,"msg":this.msg}
  }
  body(){
    return this.data
  }
}