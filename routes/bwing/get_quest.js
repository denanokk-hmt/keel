'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const crypto = moduler.crypto
const api = conf.api
const logger = require(`${REQUIRE_PATH.modules}/log`);
const msgutil = moduler.utils.message

//Log STDOUT(AWS:false, GCP:true)
const stdoutFlag = conf.env.log_stdout;

//for local testing
var res_context;

/**
 * Anonymous type Bot FAQ
 * @param {*} req 
 * @param {*} res 
 * @param {*} params
 */
const getQuest = async (req, res, params) => {

  const logiD = req.query.logiD
  console.log(`=========${logiD} GET QUEST ===========`)

  //Set client
  const client = req.client

  //Set quest message & history
  let ctalk_quest = {}
  switch (params.talk_type) {
    case 'text':
        ctalk_quest.message = msgutil.newline2whitespace(String(params.talk_quest))
        ctalk_quest.history = ctalk_quest.message
        break;
    case 'list':
    case 'string_string_chip':
    case 'string_value_chip':
    case 'string_avatar_chip':
    case 'item_image_slider':
    case 'string_string_slider':
    case 'string_value_slider':
    case 'string_image_slider':
    case 'link_image_slider':
    case 'survey':
    case 'analysis':
      //COnvert item_value & item_message 
      //to watson = item_value, to DS = item_message
      ctalk_quest.message = msgutil.newline2whitespace(String(params.talk_value))
      ctalk_quest.history = msgutil.newline2whitespace(String(params.talk_quest))
      break;
    case 'dialog':
      for (let key in params.talk_dialog_values) {
        ctalk_quest.message += ` ${params.talk_dialog_values[key].item_value}`
        ctalk_quest.history += ` ${params.talk_dialog_values[key].item_name}`
      }
      ctalk_quest.message = ctalk_quest.message.replace(/undefined /g,"")
      ctalk_quest.history = ctalk_quest.history.replace(/undefined /g,"")
      break;
    default: //init, clear_response, set_values...
      if (req.body.worth_words) {
        //worth words
        params.talk_type = 'worth_words'
        ctalk_quest.message = 'LINKAGE-WorthWords' //set same asker config value. formation.json/newest.sign
        ctalk_quest.history = req.body.worth_words.worth_word
        ctalk_quest.worth_words = req.body.worth_words
      } else {
        //init, clear_response, set_values...
        ctalk_quest.message = params.content.message
        ctalk_quest.history = ctalk_quest.message
      }
  }
  
  //Get response_context of params
  let res_context
  if (!conf.env.response_context_output) {
    res_context = { response_context: '', }
  } else if (!req.query.response_context) {
    const uuid = `${crypto.seedRandom16()}_${(new Date).getTime()}`
    res_context = { response_context: '', uuid:uuid }
  } else {
    res_context = JSON.parse(req.query.response_context)
  }
  
  //Get watson ws name of params
  const ws_no = req.query.ws

  //Get another values of params　1.0.6 時点では準備のみ
  const state = req.query.state

  //Set method name --> this js filename
  const method = __filename.substr(__filename.lastIndexOf("/") + 1).replace(".js","");

  //API base arguments
  const base_args = {logiD, client, method, ctalk_quest, res_context, ws_no, state}

  //Call API's on routine, create respons 
  let routine = {module_name : []} 
  let response = []
  for (let idx in conf.api_routines[client]) {
    
    //get routine state
    routine.state = conf.api_routines[client][idx]
    if (!api.module[routine.state]) continue;

    //Set routine module name
    routine.module_name[routine.state] = api.module[routine.state].module_name
    
    //Prepare for api func, thne exec api function
    let args = api.module[routine.state].pre.func(routine, base_args, response)
    response[routine.state] = await api.module[routine.state].func(args)

    console.log(response[routine.state])

    //buffer state, using for next api state of response
    routine.buff_state = routine.state
  }

  //Set last state response
  response = response[routine.state]

  //1st response only 
  if (res.finished) return
  
  //Response
  if (response.output) {  
    express_res.func(res, response.output)
  }
  
  //Logging(Success & Failuer)
  if (response.status_code == code.SUCCESS_ZERO) {

    delete response.output.responded.response_context.system
    const responded = response.output.responded

    //JSON payload log
    const json = {
      client: client,
      logiD: logiD,
      service: conf.env.ui_module,
      uuid: response.output.uuid,
      rid: null,
      uid: null,
      responded,
    }
    //Text palload log
    const text = `client:${client}|logiD:${logiD}|service:${conf.env.ui_module}|${response.logOutStr}`

    const output = {
      type : `[INFO]`,
      json : json,
      text : text,
    }

    //Logging
    logger.systemJSON("INFO", output, conf.env.log_stdout, false);

  } else {
    logger.error(response.logOutStr, stdoutFlag, false);
  }

  return true
};
module.exports.func = getQuest;