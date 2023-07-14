'use strict';

//Operator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.oksky
const code = conf.status_code
const status = conf.status

//System module
const { postRequestWithHeaders } = require('./axios_rapper')
const conversions = require('./conversions');

/**
 * Post msg to OKSKY
 * 
 * @param {*} client
 * @param {*} data {talk, op_cust_uid, op_rid, op_access_token} 
 * @param {*} op_rid 
 * @param {*} op_cust_uid 
 * @param {*} op_access_token 
 */
const post_message = async (client, data, op_rid, op_cust_uid, op_access_token) => {
  console.log('================= POST MESSAGE TO OP DATA ', JSON.stringify(data), op_rid, op_cust_uid, op_access_token);

  //URL
  const domain = conf.env_client.operator[client].system_config.credentials.domain;
  const url_path = api_conf.api + api_conf.post_message_path;
  let oksky_url = domain + url_path;

  //Credentials
  const oksky_room_id = op_rid;
  const oksky_customer_id = op_cust_uid;
  const oksky_access_token = op_access_token;

  //Request Header
  const headers = {"X-Access-Token": oksky_access_token};
  console.log('headers =================', JSON.stringify(headers));

  //Request body
  const ctalk = JSON.parse(data.talk);
  const body = conversions.prepareMessageForOkSky({ctalk, oksky_room_id, oksky_customer_id});
  console.log('body =================', JSON.stringify(body));

  //Drop unsupported message
  let mtype = (body && body.data && body.data.attributes && body.data.attributes.kind)
  switch (mtype) {
    case "text":
    case "image":
      break
    default:
      console.log("====== OKSKY POST MESSAGE Dropped (unsuppoerted mtype)")
      return({
        type: "Operator",
        status_code : code.ERR_S_OPERATOR_MSG_910,
        status_msg : status.ERR_S_OPERATOR_MSG_910,
        approval : false,
      })
  }

  //IP制限(TaxiWay利用)対応
  body.client = client

  //Post message to OKSKY
  const result = await postRequestWithHeaders('POST', oksky_url, body, headers, response => {
    return response.data
  })
  .catch(err => {
    console.error(JSON.stringify(err))
    const result = {
      type: "Operator",
      status_code : code.ERR_S_OPERATOR_MSG_910,
      status_msg : status.ERR_S_OPERATOR_MSG_910,
      approval : false,
    }
    return result
  })

  console.log("====== OKSKY POST MESSAGE RESULT", JSON.stringify(result));
  return result

};

module.exports.post_message = post_message;