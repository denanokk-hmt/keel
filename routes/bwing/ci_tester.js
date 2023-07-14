'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//System modules
const conversation = require(`${REQUIRE_PATH.modules}/${conf.api_conn.conversationAPI.module}/api`);
const express_res = conf.express_res


/**
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const ciTester = async (req, res, next) => {

  //needs
  const ctalk_quest = {
    message : "This is Deploy testing.",
    history : "This is Deploy testing.",
  }
  const ws_no = req.query.ws
  const state = req.query.state
  const res_context = { response_context: '', }
  
  //Set method name --> this js filename
  const method = __filename.substr(__filename.lastIndexOf("/") + 1).replace(".js","");

  //Set clinet
  const client = req.client

  //Call Watson API, Get respons  
  const response = await conversation.api(0, client, method, ctalk_quest, res_context, ws_no, state)

  //1st response only
  if (res.finished) return

  //Response
  if (response.output) {
    express_res.func(res, response.output.btalk)
  }

  return true
};
module.exports.func = ciTester;