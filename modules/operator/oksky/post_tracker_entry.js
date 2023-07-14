'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.oksky
const code = conf.status_code
const status = conf.status

//System module
const { postRequestWithHeaders } = require('./axios_rapper')


/**
 * Get user from OKSKY
 * 
 * @param {*} client 
 * @param {*} op_ope_uid
 * @param {*} op_access_token 
 */
const postTrackerEntry = async (client, op_access_token, payload={}) => {
  console.log('================= POST TRACKER ENTRY TO OKSKY', client);

  //URL
  const domain = conf.env_client.operator[client].system_config.credentials.domain;
  const url_path = api_conf.api + api_conf.tracker_entry_path;
  // const url_path = api_conf.api + '/users';
  const oksky_url = `${domain}${url_path}`;

  // console.log('oksky_url', oksky_url)
  // console.log('op_access_token', op_access_token)
  // console.log('payload', JSON.stringify(payload))

  const body = {
    data: {
      type: "tracker_entries",
      attributes: {
        payload: payload
      }
    }
  }
  const headers = {
    "X-Access-Token": op_access_token,
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };

  //IP制限(TaxiWay利用)対応
  body.client = client

  const result = await postRequestWithHeaders('POST', oksky_url, body, headers, response => {
    // console.log('POST TRACKER ENTRY TO OKSKY RESULT', JSON.stringify(response));
    return {
      result : body,
      status_code : code.SUCCESS_ZERO,
      status_msg : status.SUCCESS_ZERO,
      approval : true,
    };
  })
  .catch(err => {
    console.log('POST TRACKER ENTRY TO OKSKY ERROR', JSON.stringify(err), oksky_url, JSON.stringify(headers), JSON.stringify(body));
    return {
      type: "OAuth",
      status_code : code.ERR_S_OPERATOR_LOGIN_908,
      status_msg : status.ERR_S_OPERATOR_LOGIN_908,
      approval : false,
    };
  });

  return result
};

module.exports.func = postTrackerEntry;