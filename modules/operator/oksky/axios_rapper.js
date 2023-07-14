'use strict';

//OPerator config
//const conf = require(REQUIRE_PATH.configure);
//const api_conn = conf.api_conn.operator_client

////////////////////////////////
//hanger basement class test
const lists = require(`${REQUIRE_PATH.moduler}/module_axios.json`).modules
const {Base} = require(REQUIRE_PATH.hanger_base)

//Axiosをインスタンス
class Dase extends Base {
  constructor(lists) {
    super(lists)
  }
}

//normalのaxiosとtaxiwayを使うaxiosを読み込んでおく
//taxiway側では、api_connのoperator_clientを取得しクライアント別に仕分けする
const axios_normal = new Dase(lists).normal
const axios_taxiway = new Dase(lists).taxiway

/**
 * Getリクエスト
 * @param {*} url
 * @param {*} params ※Clientコード必須
 * @param {*} headers
 * @returns
 */
const getRequestWithHeaders = async (url, params, headers, callback) => {

  const client = params.client
  const axios_type = axios_taxiway.operator_client[client].axios_type
  const system_name = axios_taxiway.operator_client[client].system_name
  params.system_name = system_name

  //axiosをセット
  const func = (axios_type == 'axios_normal')?
    axios_normal.getRequestWithHeaders
    :
    axios_taxiway.getRequestWithHeaders

  //httpリクエスト送信
  return await func(url, params, headers, response => {
    return (callback)? callback(response) : response
  })
  .catch(err => {
    throw err
  })
}

/**
 * Postリクエスト
 * @param {*} method
 * @param {*} url
 * @param {*} params ※Clientコード必須
 * @param {*} headers
 * @returns
 */
const postRequestWithHeaders = async (method, url, params, headers, callback) => {

  const client = params.client
  const axios_type = axios_taxiway.operator_client[client].axios_type
  const system_name = axios_taxiway.operator_client[client].system_name
  params.system_name = system_name

  //axiosをセット
  const func = (axios_type == 'axios_normal')?
    axios_normal.postRequestWithHeaders
    :
    axios_taxiway.postRequestWithHeaders

  //httpリクエスト送信
  return await func(method, url, params, headers, response => {
    return (callback)? callback(response) : response
  })
  .catch(err => {
    throw err
  })
}

module.exports = {
  getRequestWithHeaders,
  postRequestWithHeaders,
}