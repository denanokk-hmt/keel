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


/**
 * Get messages
 * @param {*} req 
 * @param {*} res 
 */
const getMessage = async (req, res) => {

  const logiD = req.query.logiD
  console.log(`=========${logiD} GET MSGS===========`)

  //Set client
  const client = req.client

  //Get req data
  const rid = req.query.rid
  const mtime = String(req.query.mtime).slice(0,13)
  const eqsign = req.query.eqsign
  const qty = (req.query.qty)? req.query.qty : 10;
  const asc = (req.query.asc)? true : false;
  const mtype = req.query.mtype || null;

  //Set namespace
  const ns = req.ns

  //Get Messages
  let Messages = await ds_conf.message.getMessages(ns, rid, mtime, eqsign, qty, mtype)

  //Arrange Messages
  let status_msg
  let messages　= [], resMessages
  let msgqty
  if (Messages[0]) {
    status_msg = "Get messages Success."
    msgqty = Messages.length;
    if (asc) {
      Messages = Messages.reverse(); //Sort to ASC
    }
    Messages.forEach(msg => {
      if (msg.mtype != 'histories') {
        let talk = JSON.parse(msg.talk)
        // 特殊メッセージ(talkType:command)は非表示
        if(talk.type != 'command'){
          messages.push({
            mtime: msg.mtime,
            mtype: msg.mtype,
            talk: talk,
            cdt: msg.cdt,
          })  
        }
      }
    });
  } else {
    status_msg = "Zero messages."
    msgqty = 0;
    messages = []
  }

  //Add messages qty
  resMessages = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : status_msg,
    qty: msgqty,
    messages,
  }

  //Response
  express_res.func(res, resMessages)

  return 'success';
};
module.exports.func = getMessage;