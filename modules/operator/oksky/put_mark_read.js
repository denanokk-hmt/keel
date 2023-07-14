'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.oksky
const code = conf.status_code
const status = conf.status

//System module
const { postRequestWithHeaders } = require('./axios_rapper')


/**
 * Put Mark Read to OKSKY
 * 
 * @param {*} client 
 * @param {*} token
 * @param {*} member_id
 */
const put_mark_read = async (client, token, member_id) => {
  console.log('================= PUT MARK READ TO OKSKY', client, token, member_id);

  //URL
  const domain = conf.env_client.operator[client].system_config.credentials.domain;
  const url_path = api_conf.api + `/members/${member_id}/mark_read`;//api_conf.put_mark_read_path;
  const oksky_url = `${domain}${url_path}`;

  //Get user from OKSKY
  const headers = {
    "X-Access-Token": token,
    'Accept': 'application/vnd.api+json',
  };

  //IP制限(TaxiWay利用)対応
  const params = { client : client }

  const result = await postRequestWithHeaders('PUT', oksky_url, params, headers, response => {
    return response;
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

  return result;
};

module.exports.func = put_mark_read;