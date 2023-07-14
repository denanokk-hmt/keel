'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs
const crypto = moduler.crypto
const logger = require(`${REQUIRE_PATH.modules}/log`);
const pubsub = require(`${REQUIRE_PATH.modules}/pubsub/publish`);
const op_system = conf.op_system
const msgutil = moduler.utils.message

/**
 * Send messsage to operator
 * @param {*} auth rid & uid
 * @param {*} req 
 * @param {*} res
 * @param {*} params
 */
const postOpSendMessage = async (auth, req, res, params) => {

  console.log(`=========${req.logiD} OP POST MSG===========`)

  /////////////////////////////
  //Ready to conversation

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns

  //Get reqest parameters
  const ctalk_type = params.talk_type
  const ctalk_img_url = params.talk_img_url
  const ctalk_img_alt = params.talk_img_alt
  const ctalk_mtime = (!req.body.mtime)? (new Date()).getTime() : req.body.mtime

  //Set quest message & history
  let ctalk_quest = {}
  let ctalk_type_pseudo // Usually, OP don't accept WhatYa ctalk_types, so convert to standard type message.
  switch (ctalk_type) {
    case 'text':
    case 'image':
      let cq_message = String(params.talk_quest)
      ctalk_quest.message = msgutil.newline2whitespace(cq_message)
      ctalk_quest.history = msgutil.newline2escaped(cq_message)
      break;
    case 'list':
    case 'lists':
      ctalk_quest.message = msgutil.newline2escaped(String(params.talk_value))
      ctalk_quest.history = msgutil.newline2escaped(String(params.talk_quest))
      ctalk_type_pseudo = "text"
      break;
    default : //'init','set_values',,,
      ctalk_quest.message = ctalk_type
      ctalk_quest.history = "[対応していないメッセージです]"
  }


  /////////////////////////////
  //Set customer data

  //Set customer message
  const ctalk = {
    type : (ctalk_type_pseudo || ctalk_type),
    content : { 
      message : ctalk_quest.history, 
      img_url: ctalk_img_url, 
      alt: ctalk_img_alt
    },
    mtime: ctalk_mtime,
  }

  //Get response_context
  let res_context = '';
  let entity = await ds_conf.user.getUserResContext(ns, String(auth.uid))

  //response_context initial setting
  if (ctalk_type == 'init') {
    res_context = { response_context: '', }
  } else if (!entity || !entity[0].response_context || entity[0].response_context == '""') {
    res_context = { response_context: '' }
  } else {
    res_context = JSON.parse(entity[0].response_context)
  }

  //Set uuid
  if (!res_context.uuid) {
    res_context.uuid = `${crypto.seedRandom16()}_${(new Date).getTime()}`
  }

  //Get newest snack bar
  let newest = null
  const response_newest = await ds_conf.newest.getResponsies(`WhatYa-Newest-${client}-${conf.env.environment}` ,client)
  for (let idx in response_newest) {
    let talk = JSON.parse(response_newest[idx].talk)
    if (talk.newest) {
      newest = talk.newest
      break;
    }
  }

  //Put customer message
  const dsMessage = await ds_conf.message.postMessage(
    ns,
    String(auth.rid), 
    String(auth.uid), 
    'customer', 
    JSON.stringify(ctalk), 
    ctalk_mtime,
    false,
    null
  );
  console.log(`=========${params.logiD} OP MSG DS:`, JSON.stringify(dsMessage))

  /////////////////////////////
  //Customer msg respond (send msg to Operator system)

  let response = {}//must return status_code. see & use common.json
  response.response_context = res_context

  //OKSKY login, get & put access token
  let session
  if (!params.op_access_token) {
    
    const login = await op_system[client].post_login.login(client);
    if (!login.approval) {
      express_res.func(res, login)
      return login;
    }
    console.log(`============${params.logiD} OP ACCESS TOKEN`, JSON.stringify(login))

    const op_values = {
      op_system : op_system[client].system,
      op_access_token : login.result.access_token,
    }

    //Check session
    session = await ds_conf.session.getBySessionId(ns, params.token)
    console.log(`=========${params.logiD} <<KEEL CHK SESSSION By Key>:${JSON.stringify(session)}`)

    //put oparator system access token to session
    if (session) {
      await ds_conf.session.putSession({
        ns,
        session: session[0],
        addProp: {
          ...op_values,
          op_session: session[0].op_session || null
        } 
      });
    } else {
      throw new Error("Could not find session.")
    }

  }

  //publish to pubsub
  //execにsubscriberとして処理を実行させるための名称を指定
  //pubsub/subscriber_setter.jsにその名称でCallする処理を登録しておく
  let topic = `projects/${conf.google_prj_id}/topics/keel_${client}_${conf.env.environment}`
  if (conf.env_client.subscription_suffix[client]) topic = `${topic}_${conf.env_client.subscription_suffix[client]}`
  const data = {
    exec : 'send_msg_2op',
    ...dsMessage.key,
    uuid : res_context.uuid,
    sessionId : params.token,
    client : client,
  }
  const orderingKey = req.params.customer_uuid //メッセージ順序用のタグ
  const result = await pubsub.publishMessage(topic, JSON.stringify(data), orderingKey)
  .then(result => {
    return {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Success user msg published.",
      qty: 0,
      messages : [],
      published : result
    }
  })
  .catch(err => {
    throw err;
  })

  //Response
  express_res.func(res, result)


  /////////////////////////////
  //Logging
  if (response) {
    response.type = ctalk_type
    response.ctalk_quest = ctalk_quest
    const body = {
      client: client,
      service: conf.env.ui_module,
      uuid: res_context.uuid,
      rid: auth.rid,
      uid: auth.uid,
      response,
    }
    const quest = (ctalk_quest.history)? `${ctalk_quest.message}/${ctalk_quest.history}` : ctalk_quest.message
    const logOutStr = `uuid:${res_context.uuid}|quest:${quest}`;

    //Get session
    const log_sessions = await ds_conf.session.getBySessionId(ns, params.token);
    const log_session = (log_sessions && log_sessions.length) ? log_sessions[0] : {}

    let op_info = []
    for (let key of ['rid', 'uid', 'op_system', 'op_rid', 'op_cust_uid', 'op_ope_uid']){
      op_info.push(`${key}:${log_session[key] || ''}`)
    }  
    const text = `client:${client}|logiD:${params.logiD}|service:${conf.env.ui_module}|${logOutStr}|mtype:customer|hmt_id:${auth.hmt_id || ''}|${op_info.join('|')}`
    //Combine log
    const output = {
      type : `[INFO]`,
      json : body,
      text : text,
    }

    //Logging
    logger.systemJSON("INFO", output, conf.env.log_stdout, false);
  }
};
module.exports.func = postOpSendMessage;