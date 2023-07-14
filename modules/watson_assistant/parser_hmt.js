'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs


/**
 * ///////////////////////////////////////////////////
 * Error parse for WhatYa
 * @param {*} client
 * @param {*} error
 * @param {*} ctalk_quest
 */
const parserError = async (client, error, ctalk_quest) => {
  
  const def_msg = await ds_conf.answers.getDefaultMessages(client)
  const type = (error.type)? error.type : 'SYSTEM'
  const status_code = (error.status_code)? error.status_code : code.ERR_A_SYSTEM_990

  let message
  switch (error.status_code) {
    case code.ERR_V_LEN_MIN_202:
        message = def_msg.min_length_error
      break;
    case code.ERR_V_LEN_MAX_203:
        message = def_msg.max_length_error
      break;
    case code.ERR_S_API_REQ_902:
    case code.ERR_S_AI_API_903:
        message = def_msg.conversation_api_error
      break;
    case code.ERR_S_TIME_OUT_904:
        message = def_msg.timeout_error
      break;
    case code.ERR_S_AI_CONFIDENCE_906:
        message = def_msg.confidence_error
      break;
    default :
      message = def_msg.system_error
  }

  //empty care
  message = (message)? message : ""

  //Arrange response
  let dt
  let cnt = 0
  let messages = []
  message = message.split('|')
  const exp = /R[0-9]+_*[0-9]+_*[0-9]*/;  //"R" & "_" & num Regex for search
  for(let idx in message) {
    dt = new Date()
    let msg = message[idx]
    if (String(msg).match(exp)) {
      let response = await ds_conf.responsies.getResponse(`WhatYa-Asker-${client}-${conf.env.environment}`, client, msg)
      if (response.length != 0) {
        let talk = JSON.parse(response[0].talk)
        messages.push({
          mtime : dt.getTime(),
          mtype : "bot",
          talk : {
            type: talk.type,
            content : talk.content,
          },
          cdt : dt
        });
      }
    } else {
      messages.push({
        mtime : dt.getTime(),
        mtype : "bot",
        talk : {
          type: "text",
          content : {
            message : msg,
          }
        },
        cdt : dt
      });
    }
    cnt++
  }

  return {
    type : type,
    status_code : status_code,
    approval : false,
    answer : {
      output : {
        btalk : {
          type : "API",
          status_code : 0,
          status_msg : "Success.",
          qty : cnt,
          messages,
        },
        responded : null,
      },
    }
  }
}
module.exports.funcErr = parserError