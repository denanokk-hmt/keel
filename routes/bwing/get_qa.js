'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//System modules
const conversation = require(`${REQUIRE_PATH.modules}/${conf.api_conn.conversationAPI.module}/api`);
const logger = require(`${REQUIRE_PATH.modules}/log`);

const moduler = require(REQUIRE_PATH.moduler)
const msgutil = moduler.utils.message

var res_context;

/**
 *
 * @param {*} req 
 * @param {*} res 
 */
const getQa = async (req, res) => {

  const logiD = req.query.logiD

  //Set client
  const client = req.client

  //Set quest message & history
  let ctalk_quest = {}
  switch (req.query.type) {
    case 'text':
        ctalk_quest.message = msgutil.newline2whitespace(String(req.query.talk_quest))
        ctalk_quest.history = ctalk_quest.message
        break;
    case 'list':
    case 'lists':
    case 'chip':
    case 'chips':
      ctalk_quest.message = msgutil.newline2whitespace(String(req.query.talk_value))
      ctalk_quest.history = msgutil.newline2whitespace(String(req.query.talk_quest))
      break;
    case 'dialog':
      for (let key in params.talk_dialog_values) {
        ctalk_quest.message += ` ${req.query.dialog_values[key].item_value}`
        ctalk_quest.history += ` ${req.query.dialog_values[key].item_name}`
      }
      ctalk_quest.message = msgutil.newline2whitespace(ctalk_quest.message)
      ctalk_quest.history = msgutil.newline2whitespace(ctalk_quest.history)
      break;
    default : //'init','set_values':
      ctalk_quest.message = msgutil.newline2whitespace(String(req.query.talk_quest))
      ctalk_quest.history = ctalk_quest.message
  }

  //initaila response context
  if (!res_context) {
    res_context = { response_context: '', }
  }
  const ws_no = req.query.ws
  const state = req.query.state

  //Set method name --> this js filename
  const method = __filename.substr(__filename.lastIndexOf("/") + 1).replace(".js","");

  //Call Watson API, Get respons  
  const response = await conversation.func(logiD, client, method, ctalk_quest, res_context, ws_no, state)

  //1st response only 
  if (res.finished) return

  //Response
  if (response.output) {

    //Connect recommend items
    if (response.output.btalk_type && response.output.btalk_type.match('connect_')) {
      response.output = await conn.getRecommends(response.output)
    }
    //Response to cockpit
    express_res.func(res, response.output.btalk)
  }

  res_context = JSON.stringify(response.output.responded.response_context)
  console.log(res_context)
  
  //Logging(Success & Failuer)
  if (response.status_code == code.SUCCESS_ZERO) {
    logger.system(response.logOutStr, conf.env.log_stdout, false);
  } else {
    res_context = { response_context: '', }
    res_context = JSON.stringify(res_context)
    logger.error(response.logOutStr, conf.env.log_stdout, false);
  }
};
module.exports.func = getQa;