'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs.session
const ds_smsg = moduler.kvs.sysmsg
const request = require('./post_message');
const op_module = require('./post_login');


/**
 * Send customer msg to OKSKY
 * @param {*} data
 */
const sendDisconnectMessageToOksky = async data => {
  console.log("================= SEND DISCONNECT MESSAGE DATA ", JSON.stringify(data))
  try {

    ////////////////////////////////
    //OKSKY login
    
    //Get client
    const client = data.client

    //Get session
    const session = await ds_conf.getBySessionId(data.namespace, data.sessionId);
    console.log('=================== SEND DISCONNECT MESSAGE SESSION ', JSON.stringify(session))
    if (!session || !session.length) {
      const result = {
        type: "OAuth",
        status_code : code.ERR_A_SYSTEM_990,
        status_msg : status.ERR_A_SYSTEM_990,
        approval : false,
      }
      throw new Error(result)
    }

    //Set op values from session entity
    let op_access_token = session[0].op_access_token
    let op_rid = session[0].op_rid
    let op_cust_uid = session[0].op_cust_uid

    //if there's no op_access_token in session , do login and put it in session
    if (!op_access_token) {
      //切断メッセージ送信時、OKSKYルームが存在しない場合にはメッセージを送信しない
      //※ルーム未作成時にOKSKYにログイン、メッセージ送信を行うと切断メッセージのみの不正なルームが作成される問題解消のため
      console.log('skip to send disconnect message. no op room.', JSON.stringify(session[0]))
      return { status_code: code.SUCCESS_ZERO, status_msg: "skip to send disconnect message. no op room." };
    }

    ////////////////////////////////
    //Send Disconnect Message to OKSKY

    // Error: TypeError: ds_smsg.getSysmsgFor is not a function
    const msg_content = await ds_smsg.getSysmsgFor(data.namespace, "op_disconnect")

    //Set Disconnected Message
    const msg_talk = {
      talk : JSON.stringify({
        type : "text",
        content : {
          message : msg_content
        }
      })
    }

    let token = op_access_token;
    let uid   = op_cust_uid;
    //切断メッセージをCTに登録されたアドミンアカウント（WhatYaBOT）として送信する対応
    //※CTへのadmin_uid未登録時を考慮し、admin_xxxが取得できない場合には従来どおりユーザとして投稿を行う
    const credentials = conf.env_client.operator[client]?.system_config?.credentials;
    if (credentials?.admin_access_token && credentials?.admin_uid) {
      token = credentials.admin_access_token;
      uid   = credentials.admin_uid;  
    }

    //Post message to OKSKY
    const oksky_result = await request.post_message(
      client,
      msg_talk,
      op_rid,
      uid,
      token,
    );

    return oksky_result;

  } catch(err) {
    throw new Error(err);
  }
}

module.exports.func = sendDisconnectMessageToOksky;