'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.session
const ds_smsg = moduler.kvs.sysmsg
const post_message = require('./post_message')

/**
 * Send disconnect infomation to LINE WORKS.
 * @param {*} data
 */
const sendDisconnectMessageToLineWorks = async data => {
  console.log("================= SEND DISCONNECT MESSAGE DATA ", JSON.stringify(data))
  try {
    ////////////////////////////////
    //LINE WORKS login
    
    //Get client
    const client = data.client

    //Get session
    const session = await ds_conf.getBySessionId(data.namespace, data.sessionId)
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
    let op_rid = session[0].op_rid

    ////////////////////////////////
    //Send Disconnect Message to LINE WORKS

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

    //Post message to OKSKY
    const result = await post_message.post_message(
      client,
      msg_talk,
      op_rid,
    )

    return result

  } catch(err) {
    throw new Error(err)
  }
}

module.exports.func = sendDisconnectMessageToLineWorks
