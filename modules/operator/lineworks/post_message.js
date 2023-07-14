'use strict'

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const axios = moduler.http


/**
 * Post msg to LINEWorks
 * 
 * @param {*} client 
 * @param {*} data message entity
 * @param {*} roomId
 */
const post_message = async (client, data, roomId) => {
  console.log('================= POST MESSAGE TO OP DATA ', JSON.stringify(data), roodId)
  
  const credentials = conf.env_client.operator[client].system_config.credentials

  //URL
  const url = "https://apis.worksmobile.com/r/" + credentials.api_id + "/message/v1/bot/" + credentials.bot_no + "/message/push"

  // error handling.
  const errorHandle = err => {
    console.error(JSON.stringify(err))
    const result = {
      type: "Operator",
      status_code : code.ERR_S_OPERATOR_MSG_910,
      status_msg : status.ERR_S_OPERATOR_MSG_910,
      approval : false,
    }
    return result
  }

  /*
  consumer_key is a LINEWorks Server API Consumer Key.
  token is a LINEWorks Access Token that It related with consumer_key. It is **not** TOKEN STRING, so **don't** include "Bearer " prefix.
  */
  const authorizationHeader = {
    "consumerKey": credentials.consumer_key,
    "Authorization": ("Bearer " + credentials.token)
  }

  // Construct message content.
  let content = {}
  switch (data.type) {
    case 'text':
      content["type"] = "text"
      content["text"] = data.content.message
      break
    case 'image':
      // TODO: Way to image treating.
      content["type"] = "image"
      content["previewUrl"] = data.content.img_url
      content["resourceUrl"] = data.content.img_url
      break
    default:
      errorHandle("Unsupported message type is given.")
  }
  
  /*
  bot_no : LINEWorks botNo.
  roomId : roomId where is posting to.
  content : message content. Content keys are depend on type.
  */
  let param = {
    "botNo": credentials.bot_no,
    "roomId": roomId,
    "content": content,
  }

  console.log('body =================', JSON.stringify(param))

  // Post message to LINE WORKS
  let result = await axios.postRequestWithHeaders("POST", url, params, authorizationHeader)
    .then(axres => {
      return {
        result : axres.data,
        status_code : code.SUCCESS_ZERO,
        status_msg : status.SUCCESS_ZERO,
        approval : true,
      }
    })
    .catch(err => {
      const res = err.respones && err.response.data
      if (res && res.code) {
        return errorHandle("OP-LINEWorks " + res["code"] + ": " + res["message"] + " on " + res["domain"])
      } else {
        return errorHandle("OP-LINEWorks Unknown webhook failure on room")
      }
    })

  console.log("====== LINEWORKS POST MESSAGE RESULT", JSON.stringify(result))
  return result
}

module.exports.post_message = post_message