'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs
const post_message = require('./post_message')
const op_module = require('./post_login')


/**
 * Send customer msg to LINE WORKS
 * @param {*} data
 */
const sendMessageToLineWorks = async data => {
  console.log("================= SEND MESSAGE DATA ", JSON.stringify(data))
  try {
    
    ////////////////////////////////
    // LINE Works Create room
    
    //Get system config
    const client = data.client
    const env_client = conf.env_client.operator[client].system_config
    
    //Get session
    const session = await ds_conf.session.getBySessionId(data.namespace, data.sessionId)
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

    //Get OP LINEWORKS roomId from session entity
    let op_rid = session[0].op_rid
    let timestamp = session[0].op_access_token || 0
    let current = Math.floor(Date.now() / 1000)

    // Check time elapsed (expiring room.)
    // (current - timestamp) ... elapsed seconds from last post.
    if (Math.floor((current - timestamp) / 60) > (env_client.keepmin || 60)) { op_rid = null }
    
    // (re-)Create room.
    if (!op_rid) {
      const login = await op_module.login(client)
      if(!login.approval) { return login } // Cut off this function on fail.
      
      // login.result is a Object from LINE WORKS Response JSON. Here is converting.
      op_rid = login.result["roomId"]
    }

    // Anyway, "access token" is used as UNIXtime on last post. So it need to update session.
    let sess_result = await ds_conf.session.putSession({
      ns: data.namespace,
      session: session[0],
      addProp: { op_rid : op_rid,
        op_access_token : current,
        op_session : session[0].op_session || null,
      }
    })
    console.log('======== PUT OP VALUES IN SESSION ', JSON.stringify(sess_result))
      
    ////////////////////////////////
    //Send Message to LINE WORKS.
      
    //Get Customer Message by message id in data.
    const dsMessage = await ds_conf.message.getMessageByMid(data.namespace, data.id)
    
    //Post message to LINE WORKS
    const op_result = await post_message.post_message(
      client,
      dsMessage[0],
      op_rid,
    )

    return op_result

  } catch(err) {
    throw new Error(err)
  }
}

module.exports.func = sendMessageToLineWorks