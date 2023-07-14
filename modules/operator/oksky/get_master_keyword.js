'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const api_conf = conf.api_conn.operator.oksky

//System module
const { getRequestWithHeaders } = require('./axios_rapper')

const PAGE_SIZE = 100;
const MAX_PAGE_NUM = 10;
const getKeyword = async (url, client, token) => {

  //IP制限(TaxiWay利用)対応
  const params = { 
    client : client,
  }
  
  const headers = {
    "X-Access-Token": token,
    'Accept': 'application/vnd.api+json',
  };
  let result = await getRequestWithHeaders(url, params, headers)
  .catch(err => {
    throw err;
  })
  return result.data;
};

/**
 * Get user from OKSKY
 * 
 * @param {*} client 
 * @param {*} op_ope_uid
 * @param {*} op_access_token 
 */
const getMasterKeyword = async (client) => {
  console.log('================= GET MASTER KEYWORD FROM OKSKY', client);

  //URL
  const domain = conf.env_client.operator[client].system_config.credentials.domain;
  const url_path = api_conf.api + api_conf.master_keyword_path;
  const op_access_token = conf.env_client.operator[client].system_config.credentials.admin_access_token
  const oksky_url = `${domain}${url_path}`;
  console.log('oksky_url', oksky_url)
  console.log('op_access_token', op_access_token)

  //Get user from OKSKY
  let data = [];
  for (let page_num = 1;page_num < MAX_PAGE_NUM;page_num++) {
    let api_url = `${oksky_url}?page[size]=${PAGE_SIZE}&page[number]=${page_num}`;
    let apiResult = await getKeyword(api_url, client, op_access_token).catch(err => {
      console.log(JSON.stringify(err))
      return null;
    });
    if (!apiResult) {
      return null;
    }
    data = data.concat(apiResult.data || []);
    if (!apiResult.links?.next) {break;}
  }

  console.log("====== OKSKY GET MASTER KEYWORD RESULT", data.length, JSON.stringify(data));
  return data;
};

module.exports.func = getMasterKeyword;