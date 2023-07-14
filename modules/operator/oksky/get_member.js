'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.oksky
const code = conf.status_code
const status = conf.status

//System module
const { getRequestWithHeaders } = require('./axios_rapper')

/**
 * Get member from OKSKY
 * 
 * @param {*} client 
 * @param {*} op_rid
 */
const get_member = async (client, op_rid) => {
  console.log('================= GET MEMBER FROM OKSKY', client, op_rid);

  //URL
  const domain = conf.env_client.operator[client].system_config.credentials.domain;
  const url_path = api_conf.api + `/rooms/${op_rid}/members`;//api_conf.get_member_path;
  const oksky_url = `${domain}${url_path}`;
  const op_access_token = conf.env_client.operator[client].system_config.credentials.admin_access_token;

  //IP制限(TaxiWay利用)対応
  const params = { 
    client : client,
  }
  
  //Get user from OKSKY
  const headers = {
    "X-Access-Token": op_access_token,
    'Accept': 'application/vnd.api+json',
  };
  const result = await getRequestWithHeaders(oksky_url, params, headers, response => {
    return response.data;
  })
  .catch(err => {
    console.error(JSON.stringify(err));
    return {
      type: "OAuth",
      status_code : code.ERR_S_OPERATOR_LOGIN_908,
      status_msg : status.ERR_S_OPERATOR_LOGIN_908,
      approval : false,
    };
  });

  // console.log("====== OKSKY GET MEMBER RESULT", JSON.stringify(result));
  const data = result.data || {};
  return data;
};

module.exports.func = get_member;