'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status
const default_msg = conf.default_message;

/////////////////////////////////////////////////
/**
 * Result arrange
 * get intents, entiteis, arrange talk
 * @param {*} response 
 */
const resultArrange = (response, idx) => {

  const intents = {
      intents : response.intents,
      confidence : response.confidence[0],
  }
  const entities = {
    entities : response.entities,
    confidence : response.confidence[0],
  }

  //Set response type & contents.message
  let res_type, res_msg
  if (!response.output.text[idx].type) {
    res_type = 'text'
    res_msg = response.output.text[idx]
  } else {
    res_type = response.output.text[idx].type
    res_msg = response.output.text[idx].content.message
  }

  //Set bot talking for response set
  let talk
  if (response.output.text[idx].type) {
    response.output.text[idx].content.message = res_msg
    talk = response.output.text[idx]
  } else {
    talk = {
      type: 'text',
      content: {
        message: res_msg,
      },
    }
  }
  
  //Return success message with OK-SKY responce format
  return(
    {
      conversation_id : null,
      intents,
      entities,
      talk,
      text: res_msg,
      nodes_visited : null,
      response_context : { notihng : '' },
      res_type : res_type,
      org_answer : response.org_answer,
    }
  );
}
module.exports.resultArrange = resultArrange;


/////////////////////////////////////////////////
/**
 * Convert Error result
 * Error: Validate, Timeout, API error
 * @param {*} result 
 */
const convertErrors = (result) => {

  if (result.error) {
    let msg, intent, entity
    switch (result.error.message) {
      case 'Timeout' :
        result.status_code = code.ERR_S_TIME_OUT_904
        result.status = status.ERR_S_TIME_OUT_904
        msg = default_msg.timeout_error
        intent = 'Timeout error'
        entity = 'Timeout error'
        break;
      default :
        result.status_code = code.ERR_S_AI_API_903
        result.status = status.ERR_S_AI_API_903
        msg = default_msg.conversation_api_error;
        intent = 'Watson Assistant error'
        entity = 'Watson Assistant error'
    }
    result.conversation_id = intent
    result.talk = {
      type: 'text',
      content: {
        message: msg,
      }, 
    }
    result.intents = {
      intents : intent,
      confidence : 0,
    }
    result.entities = {
      entities : entity,
      confidence : 0,
    }
    result.response_context = '' 
    result.res_type = 'text'
  }

  //Retrun formatting JSON answers
  return({
    status_code : result.status_code,
    status_msg : result.status,
    conversation_id: result.conversation_id,
    org_answer :result.org_answer,
    intents : result.intents,
    entities : result.entities,
    confidence: [ result.intents.confidence, result.entities.confidence ],
    response_context : result.response_context,
    nodes_visited : result.nodes_visited,
    talk : result.talk,
    btalk_type: result.res_type,
  });
};
module.exports.convertErrors = convertErrors;


/////////////////////////////////////////////////
/**
 * Bot talk convert
 * @param {*} answer
 * @param {unixtime} ut  
 * @param {date} dt 
 */
const convertBtalk = (answer, num) => {
  const dt = new Date()
  let ut = dt.getTime()
  const talk = answer.talk
  let response_context
  if (conf.env.response_context_output) {
    response_context = answer.response_context
    return {
      mtime: ut + num,
      mtype: "bot",
      talk,
      response_context,
      cdt: dt,
    }
  } else {
    return {
      mtime: ut + num,
      mtype: "bot",
      talk,
      cdt: dt,
    }
  }
}
module.exports.convertBtalk = convertBtalk;


/////////////////////////////////////////////////
/**
 * Arrange responded
 * @param {*} answer
 * @param {*} messages 
 * @param {*} num
 * @param {*} status_code
 * @param {*} status_text
 */
const responded = (answer, messages, num, status_code, status_text) => {
  //responded(intents, entities, response_context) is arry[0]
  const responded = {
    org_answer : answer[0].org_answer,
    intents : answer[0].intents,
    entities : answer[0].entities,
    response_context : answer[0].response_context,
    nodes_visited : answer[0].nodes_visited,
    confidence : {
      intents : answer[0].confidence[0],
      entities : answer[0].confidence[1],
    }
  }
  
  status_code = (!status_code)? code.SUCCESS_ZERO : status_code
  status_text = (!status_text)? status.SUCCESS_ZERO : status_text

  const btalk = {
    type : "API",
    status_code : status_code,
    status_msg : status_text,
    qty: num,
    messages,
  }
  return {
    responded : responded,
    btalk_type : answer[0].btalk_type,
    btalk,
  }
}
module.exports.responded = responded;
