'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.session
const logger = require(`${REQUIRE_PATH.modules}/log`);
const op_system = conf.op_system


/**
 * Signin to Operator system
 * @param {*} req 
 * @param {*} res
 */
const putOpSignIn = async (req, res, params) => {

  const logiD = req.body.logiD
  console.log(`=========${logiD} PUT OP SIGNIN ===========`)

  /////////////////////////////
  //Ready to conversation

  //Set client
  const client = req.client
  const token  = params.token
  const data   = params.data
  
  const login = await op_system[client].initialize.func(client, token, data);
  if (!login.approval) {
    express_res.func(res, login)
    return login;
  }

  let result = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "success signin to op.",
    qty: 0,
    messages: [],
    // token: login.result.access_token,
  }

  //Response
  express_res.func(res, result)

  //Get session
  const ns = req.ns
  const session = await ds_conf.getBySessionId(ns, token)
  .then(result =>{ return (!result)? {} : result[0] })
  .catch(err =>{ throw(err) })

  /////////////////////////////
  //Logging
  const responded = result
  const body = {
    client: client,
    service: conf.env.ui_module,
    uuid: null,
    rid: session.rid,
    uid: session.uid,
    responded,
  }
  let op_info = []
  for (let key of ['rid', 'uid', 'op_system', 'op_rid', 'op_cust_uid', 'op_ope_uid']){
    op_info.push(`${key}:${session[key] || ''}`)
  }
  const text = `client:${client}|logiD:${logiD}|service:${conf.env.ui_module}|data:${JSON.stringify(data)}|hmt_id:${session.op_session || ''}|${op_info.join('|')}`

  //Combine log
  const output = {
    type : `[INFO]`,
    json : body,
    text : text,
  }

  //Logging
  logger.systemJSON("INFO", output, conf.env.log_stdout, false);

  return {
    result,
    oauth: session,
  }
};
module.exports.func = putOpSignIn;
