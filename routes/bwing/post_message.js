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
const msg_module = require(`${REQUIRE_PATH.modules}/messages/`)
const api = conf.api
const msgutil = moduler.utils.message



/**
 * Send message to Bot
 * @param {*} auth rid & uid
 * @param {*} req 
 * @param {*} res
 * @param {*} params
 */
const postMessage = async (auth, req, res, params) => {

  const logiD = req.logiD
  console.log(`=========${logiD} POST MSG===========`)

  /////////////////////////////
  //Ready to conversation
  let response = []
  //Set message epoctime
  const ctalk_mtime = (!req.body.mtime)? (new Date()).getTime() : req.body.mtime

  //Set quest message & history
  let ctalk_quest = {}
  switch (params.talk_type) {
    case 'text':
        ctalk_quest.message = msgutil.newline2escaped(String(params.talk_quest))
        ctalk_quest.history = ctalk_quest.message
        break;
    case 'list':
    case 'string_string_chip':
    case 'string_value_chip':
    case 'string_avatar_chip':
    case 'item_image_slider':
    case 'string_string_slider':
    case 'string_value_slider':
    case 'string_image_slider':
    case 'link_image_slider':
    case 'survey':
    case 'analysis':
      //COnvert item_value & item_message 
      //to watson = item_value, to DS = item_message
      ctalk_quest.message = msgutil.newline2escaped(String(params.talk_value))
      ctalk_quest.history = msgutil.newline2escaped(String(params.talk_quest))
      break;
    case 'dialog':
      for (let key in params.talk_dialog_values) {
        ctalk_quest.message += ` ${params.talk_dialog_values[key].item_value}`
        ctalk_quest.history += ` ${params.talk_dialog_values[key].item_name}`
      }
      ctalk_quest.message = ctalk_quest.message.replace(/undefined /g,"")
      ctalk_quest.history = ctalk_quest.history.replace(/undefined /g,"")
      break;
    default: //init, clear_response, set_values...
      if (req.body.worth_words) {
        //worth words
        params.talk_type = 'worth_words'
        ctalk_quest.message = 'LINKAGE-WorthWords' //set same asker config value. formation.json/newest.sign
        ctalk_quest.history = req.body.worth_words.worth_word
        ctalk_quest.worth_words = req.body.worth_words
      } else {
        //init, clear_response, set_values...
        ctalk_quest.message = params.content.message
        ctalk_quest.history = ctalk_quest.message
      }
  }


  /////////////////////////////
  //Set datastore values

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns
  
  /////////////////////////////
  //Treat messages

  const treat_msg = await msg_module.treatMessages(
    {
      ns,
      hmt_id: auth.hmt_id,
      params: {
        ...params,
        uuid: req.customer_uuid
      },
      ctalk_quest,
      logiD
    }
  );

  /////////////////////////////
  //Set customer data

  //Get response_context
  let res_context = await msg_module.getResContext(
    {
      ns,
      rid: auth.rid,
      uid: auth.uid,
      params: {...params},
    }
  );

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

  //Set customer message
  const ctalk = {
    type : params.talk_type,
    content : {
      message : ctalk_quest.history,
      img_url: params.talk_img_url,
      alt: params.talk_img_alt,
    },
    mtime: ctalk_mtime,
  }

  //Put customer message
  if (!params.invoke) {
    await ds_conf.message.postMessage(
      ns,
      String(auth.rid), 
      String(auth.uid), 
      'customer', 
      JSON.stringify(ctalk), 
      ctalk_mtime,
      false,
      null
    );
  }

  /////////////////////////////
  //Respond
  if (treat_msg.hooks) {
    response = {
      logOutStr: null,
      output: {
        ...treat_msg.hooks.response
      },
      status_code: 0
    }
  } else {
    //Get watson ws name of params
    const ws_no = req.body.ws
    
    //Get annother values of params　1.0.6 時点では準備のみ
    const state = req.body.state
    
    //Set method name --> this js filename
    const method = __filename.substr(__filename.lastIndexOf("/") + 1).replace(".js","");
    
    //Set tag
    const tag = params.wy_event ? params.wy_event : null;
    
    //Set talk type into ctalk_quest object.
    ctalk_quest.talk_type = params.talk_type
    
    /////////////////////////////
    //Bot Respond
    
    //API base arguments
    const base_args = {logiD, client, method, ctalk_quest, res_context, ws_no, state, tag}
    
    //Call API's on routine, create respons 
    let routine = {module_name : []} 
    for (let idx in conf.api_routines[client]) {
      
      //get routine state
      routine.state = conf.api_routines[client][idx]
      if (!api.module[routine.state]) continue;
    
      //Set routine module name
      routine.module_name[routine.state] = api.module[routine.state].module_name
      
      //Prepare for api func, thne exec api function
      let args = api.module[routine.state].pre.func(routine, base_args, response)
      response[routine.state] = await api.module[routine.state].func(args)
    
      //buffer state, using for next api state of response
      routine.buff_state = routine.state
    }
  
    //Set last state response
    response = response[routine.state]
  }
  //1st response only 
  if (res.finished) return

  let init_flg = (['init', 'event'].indexOf(params.talk_type) != -1)
  //Response
  if (response.output) {

    //push newest snack bar
    response.output.btalk.newest = newest
  
    //Connect recommend items
    if (response.output.btalk_type && response.output.btalk_type.match('connect_')) {
      response.output = await conn.getRecommends(response.output)
    }
    
    // Modify messages before response.
    const modifiedMessages = await msg_module.modifyMessages(
      {
        ns,
        hmt_id: auth.hmt_id,
        params: {...params},
        messages: response.output.btalk.messages
      }
    );

    //Put bot message
    let btalk, btalk_mtime
    const messages = modifiedMessages.messages;
    for(let idx in messages) {
      btalk = JSON.stringify(messages[idx].talk) //Bot message
      btalk_mtime = messages[idx].mtime  //Bot answer mtime
      await ds_conf.message.postMessage(
        ns,
        String(auth.rid), 
        String(conf.env.bot_uid), 
        'bot', 
        btalk, 
        btalk_mtime,
        init_flg,
        null
      )
    }
    // Add extra (non history included) message.
    response.output.btalk.messages = messages.concat(modifiedMessages.eventlogs);

    //Response
    express_res.func(res, response.output.btalk, response.output?.responded)

    //Put response context
    if (response.output?.responded) {
      const mtime = btalk_mtime || response.output.btalk.mtime;
      await ds_conf.user.putUserResContext(
        ns,
        String(auth.rid), 
        String(auth.uid), 
        JSON.stringify(response.output.responded.response_context),
        mtime, 
        conf.init_interval[client] + (new Date).getTime()
      )
    } else if(treat_msg.hooks) {
      // update hooks interval
      await treat_msg.hooks.update_init_interval(client);
    }
  }

  
  /////////////////////////////
  //Logging(Success & Failuer)
  if (response.status_code == code.SUCCESS_ZERO) {

    delete response.output.responded?.response_context?.system
    const responded = response.output.responded

    //JSON payload log
    const json = {
      client: client,
      service: conf.env.ui_module,
      uuid: response.output.uuid,
      rid: auth.rid,
      uid: auth.uid,
      responded,
    }
    
    const text = `client:${client}|logiD:${logiD}|service:${conf.env.ui_module}|${response.logOutStr}|mtype:bot|hmt_id:${auth.hmt_id || ''}|init_flg:${init_flg}`

    //Combine log
    const output = {
      type : `[INFO]`,
      json : json,
      text : text,
    }

    //Logging
    logger.systemJSON("INFO", output, conf.env.log_stdout, false);

  } else {
    res_context = { response_context: '', }
    res_context = JSON.stringify(res_context)
    logger.error(response.logOutStr, conf.env.log_stdout, false);
  }

};
module.exports.func = postMessage;