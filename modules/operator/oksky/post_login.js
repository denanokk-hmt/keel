'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.oksky
const code = conf.status_code;
const status = conf.status;

//System module
const { postRequestWithHeaders } = require('./axios_rapper')


/**
 * Login to OKSKY
 * @param {*} client
 */
const login = async (client, params) => {

  //Oksky set credentials by client
  const oksky_credentials = conf.env_client.operator[client].system_config.credentials
  const url = oksky_credentials.domain + api_conf.login_path;
  const body = {
    client_code: oksky_credentials.client_code,
    ...params,
  };

  //IP制限(TaxiWay利用)対応
  body.client = client
  
  let result = await postRequestWithHeaders('POST', url, body, {}, response => {
    if (response.status == 204) {
      return {
        type: "OAuth",
        status_code : code.ERR_S_OPERATOR_LOGIN_908,
        status_msg : status.ERR_S_OPERATOR_LOGIN_908,
        approval : false,
      };
    }
    return response.data
  })
      
  console.log("OP LOGIN RESULT", JSON.stringify(result));
  if(result.access_token){
    return {
      result : result,
      status_code : code.SUCCESS_ZERO,
      status_msg : status.SUCCESS_ZERO,
      approval : true,
    }
  }else{
    return result;
  }
};

module.exports.login = login;