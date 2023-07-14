'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;
const status = conf.status;

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs.session
const getMember = require('./get_member');
const putMarkRead = require('./put_mark_read');


/**
 * Put MarkRead to OKSKY
 * @param {*} client
 * @param {*} token
 */
const mark_read = async (client, token) => {
  //Get session
  const ns = `${conf.env.kvs.service}-${client}-${conf.env.environment}`;
  const sessions = await ds_conf.getBySessionId(ns, token);
  // console.log('=================== SESSION ', JSON.stringify(sessions))
  if (!sessions || !sessions.length) {
    return {
      type: "OAuth",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : status.ERR_A_SYSTEM_990,
      approval : false,
    };
  }
  const currentSession = sessions[0];

  // WhatYaのセッションにOPルームIDが存在しない（OKSKYに接続したことがない）場合、
  // OKSKYへの既読通知は行わずにAPIとしては正常を返却する
  if (currentSession.op_rid) {
    //Get Member
    const members = await getMember.func(client, currentSession.op_rid).catch(err => {
      console.log(JSON.stringify(err));
      return {
        type: "MarkRead",
        status_code : code.ERR_S_OPERATOR_SYSTEM_907,
        status_msg : status.ERR_S_OPERATOR_SYSTEM_907,
        approval : false,
      }
    });
    //Get Member ID
    let member_id = null;
    if (members?.length) {
      for (let m of members) {
        if (m.relationships?.user?.data?.id == currentSession.op_cust_uid) {
          member_id = m.id;
          break;
        }
      }
    }
    if (!member_id) {
      return {
        type: "MarkRead",
        status_code : code.ERR_S_OPERATOR_SYSTEM_907,
        status_msg : status.ERR_S_OPERATOR_SYSTEM_907,
        approval : false,
      }
    }
    // Put Read Mark
    await putMarkRead.func(client, currentSession.op_access_token, member_id).catch(err => {
      console.log(JSON.stringify(err));
      return {
        type: "MarkRead",
        status_code : code.ERR_S_OPERATOR_SYSTEM_907,
        status_msg : status.ERR_S_OPERATOR_SYSTEM_907,
        approval : false,
      }
    });
  }

  return {
    type: "MarkRead",
    status_code : code.SUCCESS_ZERO,
    status_msg : status.SUCCESS_ZERO,
    approval : true,
  };
};

module.exports.func = mark_read;