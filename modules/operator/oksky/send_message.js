'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs
const request = require('./post_message');
const op_module = require('./post_login');


/**
 * Send customer msg to OKSKY
 * @param {*} data
 */
const sendMessageToOksky = async data => {
  console.log("================= SEND MESSAGE DATA ", JSON.stringify(data))
  try {

    ////////////////////////////////
    //OKSKY login
    
    //Get client
    const client = data.client

    //Get session
    const session = await ds_conf.session.getBySessionId(data.namespace, data.sessionId);
    console.log('=================== SEND MESSAGE SESSION ', JSON.stringify(session))
    if (!session || !session.length) {
      const result = {
        type: "OAuth",
        status_code : code.ERR_A_SYSTEM_990,
        status_msg : status.ERR_A_SYSTEM_990,
        approval : false,
      }
      throw new Error(result)
    }
    const current_session = session[0]
    //Set op values from session entity
    let op_access_token = current_session.op_access_token
    let op_rid = current_session.op_rid
    let op_cust_uid = current_session.op_cust_uid

    //if there's no op_access_token in session , do login and put it in session
    if (!op_access_token) {
      const login = await op_module.login(client);
      if(!login.approval) return login;

      op_access_token = login.result.access_token

      //put it in session op access token
      await ds_conf.session.putSession({
        ns: data.namespace,
        session: current_session,
        addProp: {
          op_access_token : op_access_token,
          op_session : current_session.op_session || null,
        },
      })
    }

    ////////////////////////////////
    //Send Message to OKSKY

    //Get Customer Message by message id in data.
    const dsMessage = await ds_conf.message.getMessageByMid(data.namespace, data.id);

    //Post message to OKSKY
    const oksky_result = await request.post_message(
      client,
      dsMessage[0],
      op_rid,
      op_cust_uid,
      op_access_token,
    );

    //check for oksky error
    if (oksky_result.error || !oksky_result.data || oksky_result.data.error) {
      return {
        type: "OAuth",
        status_code : code.ERR_S_OPERATOR_SYSTEM_907,
        status_msg : status.ERR_S_OPERATOR_SYSTEM_907,
        approval : false,
        message: JSON.parse(dsMessage[0].talk).content.message,
        rid: current_session.rid
      }
    }

    ////////////////////////////////
    // Set OP MessageID into message.

    if (oksky_result.data[0].id) {
      const update_result = await ds_conf.message.updateMessageForOpMid(
        Number(data.id),
        data.namespace, 
        oksky_result.data[0].id,
        dsMessage[0]
      )
      console.log(`===== Update for setting op_mid: ${JSON.stringify(update_result)}`)
    }

    ////////////////////////////////
    //Put op values to session

    //Put op values to session
    if (oksky_result.data[0].relationships.room.data.id != op_rid) {
      const dsSession = await ds_conf.session.putSession({
        ns: data.namespace,
        session: current_session,
        addProp: {
          op_system: 'oksky',
          op_access_token: op_access_token,
          op_rid: oksky_result.data[0].relationships.room.data.id,
          op_cust_uid: oksky_result.data[0].relationships.user.data.id,
          op_session: current_session.op_session,
        }
      })
      console.log('======== PUT OP VALUES IN SESSION ', JSON.stringify(dsSession));
    }

    return oksky_result;

  } catch(err) {
    throw new Error(err);
  }
}

module.exports.func = sendMessageToOksky;