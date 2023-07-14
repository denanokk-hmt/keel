'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//[System modules]
const ds_conf = moduler.kvs.message
const logger = require(`${REQUIRE_PATH.modules}/log`);
const pubsub_publish = require(`${REQUIRE_PATH.modules}/pubsub/publish`);
const op_system = conf.op_system


/**
 * Send message histories to Operator system
 * @param {*} req 
 * @param {*} res
 */
const postOpSendHistories = async (req, res) => {

  const logiD = req.logiD
  console.log(`=========${logiD} POST HISTORIES ===========`)

  /////////////////////////////
  //Ready to conversation

  //Set client
  const client = req.client

  //Get req data
  const rid = req.body.rid
  const mtime = (req.body.mtime)? String(req.body.mtime).slice(0,13) : (new Date).getTime()
  const qty = (req.body.qty)? req.body.qty : conf.env_client.operator[client].system_config.post_histories_op_qty
  const asc = true;
  const type = (req.body.type)? req.body.type : 'text';

  //Set namespace
  const ns = req.ns


  /////////////////////////////
  //Get Messages & parse
  let Messages = await ds_conf.getMessages(ns, rid, mtime, 'le', qty)

  //Get bot uid
  let botUid = conf.env.bot_uid

  //Parse Messages
  let mtype
  let talk
  let mcount = 0
  let msg = ''
  if (Messages[0]) {
    if (asc) { Messages = Messages.reverse(); } //Sort to ASC
    for (let idx in Messages) {
      if (Messages[idx].mtype === 'histories') continue;
      talk = JSON.parse(Messages[idx].talk)
      // 特殊メッセージ(talkType:command)は非表示
      if(talk.type == 'command') continue;

      switch(Messages[idx].mtype) {
        case 'customer':
          mtype = 'C'
          break
        case 'operator':
          mtype = 'O'
          break
        case 'bot':
          mtype = 'B'
          break
        default:
          mtype = ''
          break
      }
      talk = talk.content.message || ''
      msg += `${mtype}:[ ${talk.replace(/\\n/g,'\n')} ]\n`
      mcount++
    }
    msg += "【以上】です。"
    console.log("==========Message Parse check", msg)
  }

  if (mcount > 0) {
    msg = `【会話履歴${mcount}件を送信します。】\n${msg}`
  } else {
    msg = `【会話履歴は0件でした。】`
  }

  //Prepare data for sending
  const ctalk = {
    type : type,
    content : {
      message : msg,
    },
    mtime: mtime,
  };

  //Insert message to storage
  const dsMessage = await ds_conf.postMessage(ns, rid, botUid, 'histories', JSON.stringify(ctalk), mtime, false, null);

  //Set send message args
  const data = {
    namespace: ns,
    id: dsMessage.key.id,
    sessionId: req.body.token,
    client: client,
  };

  //Send histories message to operator system
  const postRes = await op_system[client].send_message.func(data)
    .catch(err => {
      throw new Error(err);
    });

  //Add messages qty
  let result = {}
  if(postRes.hasOwnProperty('approval') && !postRes.approval){
    switch(postRes.status_code){
      case 907:
      case 908:
        result = await handleOpSystemErr(logiD, postRes, dsMessage, client);
        break;
      default:
      result = postRes;
    }
  }else{
    result = {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : "success send to op.",
      qty: 0,
      messages: []
    }
  }
  //Response
  express_res.func(res, result)

  
  /////////////////////////////
  //Logging
  const responded = result
  const body = {
    client: client,
    service: conf.env.ui_module,
    uuid: null,
    rid: rid,
    uid: null,
    responded,
  }
  logger.systemJSON("INFO", body, conf.env.log_stdout, false);

};
module.exports.func = postOpSendHistories;

//error handle , login error
const handleOpSystemErr = async (logiD, errObj, dsMessage, client) => {
  let result = {
    rid: dsMessage.data.filter(msg => msg.name === "rid")[0].value,
    type: errObj.type,
    status_code: errObj.status_code,
    status_msg: errObj.status_msg,
    qty: 1,
    messages: [{
      mtype: "system",
      talk: {
        type: "text",
        content: {
          system_message: "[会話履歴は送信されませんでした。]"
        }
      }
    }]
  };

  //send to cabin topic to return to cockpit
  const topic = `projects/${conf.google_prj_id}/topics/cabin_${client}_${conf.env.environment}`

  console.log(`=========${logiD} PUBLISH DATA VALUE `, JSON.stringify(result));
  await pubsub_publish.publishMessage(topic, JSON.stringify(result));

  return result;
};