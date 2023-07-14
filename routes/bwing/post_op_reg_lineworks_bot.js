/**
 * @fileoverview LINE WORKSにbot情報を登録する
 * @author masaki@svc.co.jp (Masaki Haruka)
 */

'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn?.operator?.lineworks
const express_res = conf.express_res

const regBot = async (credentials, client) => {
  const API_ID = credentials.api_id
  const CONSUMER_KEY = credentials.consumer_key
  const TOKEN = credentials.token
  const MANAGERS = api_conf.menegers
  const URL = `https://apis.worksmobile.com/r/${API_ID}/message/v1/bot`
  const WhatYa_avator = "https://developers.worksmobile.com/favicon.png"

  console.log(`=== NEW LINE WORKS talk bot registration ${url}`)
  const request = require('request')
  let options = {url: URL}
  options.headers = {
    "Content-Type": "application/json",
    "consumerKey": CONSUMER_KEY,
    "Authorization": TOKEN
  }
  options.json = {
    "name": "WhatYa",
    "photoUrl": WhatYa_avator,
    "description": "Bridge operating between WhatYa and LINE WORKS.",
    "managers": MANAGERS,
    "useCallback": true,
    "callbackUrl": `https://${conf.server_code}-hmt-boarding.svc.app/hmt/${client}/post/op/receive/message`,
    "callbackEvents": ["text", "image"]
  }

  return new Promise((resolve, reject) => {
    request.post(options, (error, response, body) => {
      if (error) {
        console.log(`Errored for LINE WORKS talk bot registration: ${error}`)
        reject(error)
      } else {
        try {
          const res = JSON.parse(body)
          if (res && res["botNo"]) {
            resolve(res)
          } else {
            reject("Server returns no botNo.")
          }
        } catch {
          reject("Server returns invalid response.")
        }
      }
    })
  })
}

const postOpRegLineworksBot = async (req, res) => {
  const client = req.client
  const credentials = conf.env_client.operator[client].system_config.credentials
  try {
    let result = await regBot(credentials, client)
    express_res.func(res, result)
  } catch(err) {
    console.log(err)
    throw err
  }
}

module.exports.func = postOpRegLineworksBot