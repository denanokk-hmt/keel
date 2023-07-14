'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs
const logger = require(`${REQUIRE_PATH.modules}/log`);
const pubsub = require(`${REQUIRE_PATH.modules}/pubsub/publish`);
const op_system = conf.op_system


/**
 * Receive message from Operator system
 * @param {*} req
 * @param {*} res
 * @param {*} params
 */
const postOpReceiveMessage = async (req, res, params) => {

  const logiD = params.logiD
  console.log(`=========${logiD} RECEIVE OP MESSAGE body ===========`, JSON.stringify(req.body));

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns

  /////////////////////////////
  //Get & Set Session

  //Get Session by op_rid of params
  const session = await ds_conf.session.getByFilter(ns, "rid", params.rid, true);
  if (!session || !session.length) {
    const result = {
      type: "OAuth",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : status.ERR_A_SYSTEM_990,
      approval : false,
    }
    throw new Error(result)
  }

  let result = null;
  //OKSKYからのシステムメッセージ（WhatYa->OKSKYへシステム側で送信し、OKSKYからのWebhookで戻ってきたメッセージ）の場合はユーザ側に返送しない
  //※CTへのadmin_uid未登録時を考慮し、admin_uidが取得できない場合には従来どおりの処理を行う
  const admin_uid = conf.env_client.operator[client]?.system_config?.credentials?.admin_uid;
  if (admin_uid && (Number(params.op_ope_uid) == Number(admin_uid))) {
    result = {
      type: "System",
      status_code : code.SUCCESS_ZERO,
      status_msg : `skip system message.`,
      approval : true,
    }
  } else {
    //put Session with op_ope_uid
    ds_conf.session.putSession({
      ns, 
      session: session[0], 
      addProp: {
        op_system: params.op_name, 
        op_access_token: session[0].op_access_token, 
        op_rid: params.op_rid, 
        op_cust_uid: session[0].op_cust_uid, 
        op_ope_uid: params.op_ope_uid,
        op_session: session[0].op_session, 
      }
    });
  
    const get_result = async () => {
      var msg_result
      switch (params.action) {
      case "post":
        msg_result = await opReceivePostMessage(params, session, client, ns, logiD)
        break;
      case "update":
        msg_result = await opReceiveUpdateMessage(params, session, client, ns, logiD)
        break;
      case "delete":
        msg_result = await opReceiveDeleteMessage(params, session, client, ns, logiD)
        break;
      default:
        msg_result = {
          type: "System",
          status_code : code.ERR_A_SYSTEM_990,
          status_msg : status.ERR_A_SYSTEM_990,
          approval : false,
        }
        throw new Error(msg_result)
      }
      return {
        type: "System",
        status_code : code.SUCCESS_ZERO,
        status_msg : `${params.action}:${msg_result}`,
        approval : true,
      }
    }
    result = await get_result()
  }

  //Response
  express_res.func(res, result)

  //Return result
  return {
    result,
    oauth: session[0]
  }
};
module.exports.func = postOpReceiveMessage;

const opReceivePostMessage = async (params, session, client, ns, logiD) => {
  //Get Operator from operator system
  const opParam = {client: client, namespace: ns, op_ope_uid: params.op_ope_uid};
  const operator = await op_system[client].get_operator.func(opParam)
    .catch(err => {
      throw new Error(err);
    });

  /////////////////////////////
  //Set Message

  //prepare content for datastore
  const mtime = (new Date).getTime()
  const ctalk = {
    type : params.talk_type,
    content : params.content,
    mtime: mtime,
  };
  if(operator){
    ctalk.sender = {
      type: 'operator',
      system: operator.system,
      name : operator.full_name || operator.name,
      avatar_url : operator.avatar_url || operator.default_avatar_url
    }
  }

  //post DS message
  const dsMessage = await ds_conf.message.postMessage(
    ns, 
    session[0].rid,
    session[0].uid,
    'operator',
    JSON.stringify(ctalk),
    mtime,
    false,
    ctalk.content.op_mid || null,
  );
  console.log(`========${logiD} CREATE OPERATOR MESSAGE IN DATASTORE `, JSON.stringify(dsMessage));

  //get SNS
  const userSNS = await ds_conf.sns.getUserSNS(
    ns, 
    session[0].uid
  );
  console.log(`========${logiD} GET USER SNS IN DATASTORE `, JSON.stringify(userSNS));

  /////////////////////////////
  //Pubsub Publish
  let appName = 'cabin'
  // if (userSNS && userSNS.length && userSNS[0].send_to === 'operator') {
  if (userSNS && userSNS.length) {
    appName = 'transit'
  }
  //publish to pubsub into cabin topic
  let topic = `projects/${conf.google_prj_id}/topics/${appName}_${client}_${conf.env.environment}`
  if (appName == 'transit' && conf.env_client.subscription_suffix[client]) {
    topic = `${topic}_${conf.env_client.subscription_suffix[client]}`
  }
  const data = {
    ...dsMessage.key,
    rid : session[0].rid,
    client : client,
  }
  console.log(`========${logiD} PUBLISH DATA VALUE `, JSON.stringify(data));
  const result = await pubsub.publishMessage(topic, JSON.stringify(data))

  /////////////////////////////
  //Logging
  const ctalk_quest = {
    message: ctalk.content.message || ''
  }
  const response = {
    type: ctalk.type,
    ctalk_quest: ctalk_quest
  }
  const body = {
    client: client,
    service: conf.env.ui_module,
    uuid: null,
    rid: session[0].rid,
    uid: session[0].uid,
    response,
  }
  const logOutStr = `quest:${ctalk_quest.message}`;
  let op_info = []
  for (let key of ['rid', 'uid', 'op_system', 'op_rid', 'op_cust_uid', 'op_ope_uid']){
    op_info.push(`${key}:${session[0][key] || ''}`)
  }  
  const text = `client:${client}|logiD:${logiD}|service:${conf.env.ui_module}|${logOutStr}|mtype:operator|hmt_id:${session[0].op_session || ''}|${op_info.join('|')}`
  //Combine log
  const output = {
    type : `[INFO]`,
    json : body,
    text : text,
  }
  //Logging
  logger.systemJSON("INFO", output, conf.env.log_stdout, false);

  return result
}

const opReceiveUpdateMessage = async (params, session, client, ns, logiD) => {
  // Get message.
  let dsOrigMessageKey = await ds_conf.message.getMessageKeyByOpMid(ns, params.content.op_mid)
  
  if (!dsOrigMessageKey) {
    console.log(`=====${logiD} Update target message (op_mid ${params.content.op_mid}) is not exist.`)
    return
  }
  
  console.log(`=====${logiD} Target message info for update: ${JSON.stringify(dsOrigMessageKey)}`)
  const base_msg_id = Number(dsOrigMessageKey.id)

  //Get Operator from operator system
  const opParam = {client: client, namespace: ns, op_ope_uid: params.op_ope_uid};
  const operator = await op_system[client].get_operator.func(opParam)
    .catch(err => {
      throw new Error(err);
    });

  /////////////////////////////
  //Set Message

  //prepare content for datastore
  const mtime = (new Date).getTime()
  const ctalk = {
    type : params.talk_type,
    content : params.content,
    mtime: mtime,
  };
  if(operator){
    ctalk.sender = {
      type: 'operator',
      system: operator.system,
      name : operator.full_name || operator.name,
      avatar_url : operator.avatar_url || operator.default_avatar_url
    }
  }

  const origMessage = await ds_conf.message.getMessageByMid(ns, base_msg_id)

  //post DS message
  const dsMessage = await ds_conf.message.updateMessage(
    base_msg_id,
    ns, 
    JSON.stringify(ctalk),
    origMessage[0]
  )
  console.log(`========${logiD} UPDATE OPERATOR MESSAGE IN DATASTORE `, JSON.stringify(dsMessage));

  return 'Success message update.'
}

const opReceiveDeleteMessage = async (params, session, client, ns, logiD) => {
  // Get message.
  let dsOrigMessageKey = await ds_conf.message.getMessageKeyByOpMid(ns, params.content.op_mid)
  
  if (!dsOrigMessageKey) {
    console.log(`=====${logiD} Delete target message (op_mid ${params.content.op_mid}) is not exist.`)
    return
  }

  console.log(`=====${logiD} Target message info for delete: ${JSON.stringify(dsOrigMessageKey)}`)
  const base_msg_id = Number(dsOrigMessageKey.id)

  let dsMessage = await ds_conf.message.deleteMessage(ns, base_msg_id)
  console.log(`========${logiD} DELETE MESSAGE IN DATASTORE `, JSON.stringify(dsMessage));
  return 'Success delete messasge.'
}
