'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const {getRequest, postRequest} = moduler.http


/**
 * Update Asker Answers
 * @param {*} res 
 * @param {*} params
 */
const postAskerAnswersUpdate = async (res, params) => {

  console.log(`=========${params.logiD} KEEL POST ASKER ANSWERS UPDATE ===========`)

  let option, url

  //Set asker server code
  const server_code = conf.svc_asker[params.client]

  //Set request body
  option = {
    "client" : params.client,
    "version" : params.version,
    "token" : conf.conf_keel.token,
    "logiD" : params.logiD,
    "credentials" : params.credentials,
    "config" : params.config,
    "default_messages" : params.default_messages,
  }

  //Set asker server url
  url = `https://${conf.domains_asker[params.client]}/${conf.env.routes.url_api}/post/asker/answers/update`
  console.log(`=========${params.logiD} Keel to Asker post url:`, url)
    
  //Post request
  const asker_response = await postRequest('POST', url, option, )
  .catch(err => {
    throw new Error(err.message)
  })

  if (asker_response.data.status_code != code.SUCCESS_ZERO) {
    throw new Error(asker_response.data)
  }
  
  //restart server by yoke
  //Get request
  url = `https://yoke.bwing.app/cgi-bin/hmt/service/bash_index?def=1&repo=yoke-base&func=bin/restart_server&servers=${server_code}&force_latest_revisions=latest`
  console.log(`=========${params.logiD} Keel to yoke restart server url:`, url)
  const yoke_response = await getRequest(url, null)
  .then(result => {
    //Convert to Object
    return (new Function("return " + result.data))()
  })
  .catch(err => {
    throw new Error(err.message)
  })

  //Response
  if (yoke_response.status_code == code.SUCCESS_ZERO) {
    const result = {
      client : asker_response.client,
      status_code : code.SUCCESS_ZERO,
      data_update : asker_response.status_msg,
      restart_server : `${yoke_response.status_msg}${yoke_response.result}`,
      udt : new Date()
    }
    express_res.func(res, result)
  } else {
    throw new Error(yoke_response)
  }

};
module.exports.func = postAskerAnswersUpdate;