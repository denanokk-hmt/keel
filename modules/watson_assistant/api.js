'use strict'

//Timeout
const pt = require('promise-timeout');

//config
const conf = require(REQUIRE_PATH.configure);

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const {getRequestSLZ} = moduler.http
const parser = require(`./parser_${conf.env.ui_module}`)
const msgutil = moduler.utils.message


/**
 * Get Answer from Asker
 * @param {*} logiD 
 * @param {*} client
 * @param {*} method
 * @param {*} ctalk_quest {message, history}
 * @param {*} res_context {}
 * @param {*} ws_no 
 */
const asker = async ({logiD, client, method, ctalk_quest, res_context, ws_no, state, tag}) => {
  const params = {
    "logiD" : logiD,
    "client" : client,
    "version" : conf.version,
    "token" : conf.conf_keel.token,
    "method" : method,
    "ctalk_quest" : ctalk_quest.message,
    "ctalk_history" : ctalk_quest.history,
    "res_context" : res_context,
    "ws_no" : ws_no,
    "worth_words" : ctalk_quest.worth_words,
    "tag": tag || null,
  }
      
  //Set asker server url: svc-hmt-asker.bwing.app/hmt/get/asker/answers/response
  //Asker is multi. No need client-code in the url pass. not like keel url pass.
  const url = `https://${conf.domains_asker[client]}/${conf.env.routes.url_api}/get/asker/answers/response`
  //const url = `http://localhost:8089/${conf.env.routes.url_api}/get/asker/answers/response`
  console.log(`=====${logiD}==${client}==TO ASKER URL`, url)
  console.log(`=====${logiD}==${client}==TO ASKER PARAMS`, JSON.stringify(params))
 
  const result = await getRequestSLZ(url, params, response => {
    return response.data
  })
  .catch(err => {
    throw new Error(err)
  })

  switch (true) {
    case result.status_code < 200 :
      return result
    default :
      console.log(`=========${logiD} : ${JSON.stringify(result)}`)
      return parser.funcErr(client, result, ctalk_quest)
  }
};

/**
 * API Call
 * @param {*} logiD 
 * @param {*} client
 * @param {*} method
 * @param {*} ctalk_quest {message, history}
 * @param {*} res_context {}
 * @param {*} ws_no 
 * @param {*} state //1.0.6 時点では準備のみ
 */
const conversationAPI = async ({logiD, client, method, ctalk_quest, res_context, ws_no, state, tag}) => {

  ctalk_quest = {...ctalk_quest}  // Copy for modifying.
  ctalk_quest.message = msgutil.newline2whitespace(ctalk_quest.message)
  ctalk_quest.history = msgutil.newline2whitespace(ctalk_quest.history)

  //Get watson assistant answer & parse 
  return await asker({logiD, client, method, ctalk_quest, res_context, ws_no, state, tag})
    .then(async results => {
      return results.answer
    })
    .catch(err => {
      console.log(err)
      //Error Logging & Arrange error response
      return parser.funcErr(client, err, ctalk_quest.history)
  });
}
module.exports.func = conversationAPI;
