/**
 * @fileoverview LINEWorks OPに対してルームを作成する
 * @author masaki@svc.co.jp (Masaki Haruka)
 */

'use strict';

//Operator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.lineworks
const code = conf.status_code;
const status = conf.status;

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const axios = moduler.http　//"Axios" web client module.
const roomNamer = require('../roomname_random')


/**
 * Create LINEWorks talkroom
 * @param {string|number} client
 * @returns {*} create roomで得られた値。成否により内容は異なる
 */
const login = async (client) => {
  
  const credentials = conf.env_client.operator[client].system_config.credentials

  /*
    consumer_key is a LINEWorks Server API Consumer Key.
    token is a LINEWorks Access Token that It related with consumer_key. It is **not** TOKEN STRING, so **don't** include "Bearer " prefix.
  */
  const authorizationHeader = {
    "consumerKey": credentials.consumer_key,
    "Authorization": ("Bearer " + credentials.token)
  }

  const url = "https://apis.worksmobile.com/r/" + credentials.api_id + "/message/v1/bot/" + credentials.bot_no + "/room"

  /*
    bot_no : LINEWorks botNo.
    accountIds: Inviting members. (Array of Strings)
    title: Room name.
  */
  let params = {
    "botNo": credentials.bot_no,
    "accountIds": api_conf.accountIds,
    "title": (roomNamer.room("WhatYa-"))
  }

  const errorHandle = err => {
    console.error(JSON.stringify(err))
    const result = {
      type: "OAuth",
      status_code : code.ERR_S_OPERATOR_LOGIN_908,
      status_msg : status.ERR_S_OPERATOR_LOGIN_908,
      approval : false,
    }
    return result
  }

  let result = await axios.postRequestWithHeaders("POST", url, params, authorizationHeader)
    .then(axres => {
      if (axres.data?.roomId) {
        return {
          result : axres.data,
          status_code : code.SUCCESS_ZERO,
          status_msg : status.SUCCESS_ZERO,
          approval : true,
        }
      }
      else {
        return errorHandle("OP-LINEWorks No roomId returned.: " + axres.data)
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
  return result
}

module.exports.login = login
