/**
 * @fileoverview LINE WORKSから画像を取得する
 * @author masaki@svc.co.jp (Masaki Haruka)
 */

'use strict'

//config
const conf = require(REQUIRE_PATH.configure);

//express
const express_res = conf.express_res

/**
 * Get image from LINE WORKS with "request" HTTPS GET.
 * @param {string} resourceId resourceId
 */
const fetchImage = (credentials, resourceId) => {
  // LINE WORKS keys.
  const CONSUMER_KEY = credentials.consumer_key
  const TOKEN = "Bearer " + credentials.token
  const API_ID = credentials.api_id

  // It will get binary.
  const request = require('request').defaults({encoding: null})

  options = { 
    url: "http://storage.worksmobile.com/openapi/message/download.api",
    headers: {
      "consumerKey": CONSUMER_KEY,
      "Authorization": TOKEN,
      "x-works-apiid": API_ID,
      "x-works-resource-id": resourceId
    }
  }
  
  request(options, (error, response, body) => {
    if (error) {
      return null
    } else {
      return body
    }
  })
}

const getOpLineworksImg = async (req, res) => {
  const client = req.client
  const credentials = conf.env_client.operator[client].system_config.credentials

  let result = fetchImage(credentials, req.query.resourceId)

  if (result) {
    //Response
    express_res.func(res, {"data": result})
    return 'success'
  } else {
    // fail to REJECT!
    throw "Failed to get image from Works mobile."
  }
}

module.exports.func = getOpLineworksImg