'use strict'

/**
 * For Watson Assistant api function arg setting.
 * @param {*} routine 
 * @param {*} args 
 * @param {*} response 
 */
const prepareApiFuncArgs = (routine, args={}, response) => {

  //if response is and response.traslation is not nothing,
  // --> using traslation And translated.
  if (Object.keys(response) != 0 && response[routine.buff_state].translation) {
    if (args.ctalk_quest.message === args.ctalk_quest.history) {
      //for case of differrent item_name, item_value
      args.ctalk_quest.message = response[routine.buff_state].translation
      args.ctalk_quest.history = response[routine.buff_state].translation
    } else {
      //for case of differrent item_name, item_value --> exp : R0001, Hello
      //Change value only history
      args.ctalk_quest.history = response[routine.buff_state].translation
    }
  }

  return {
    logiD : args.logiD, 
    client : args.client, 
    method : args.method, 
    ctalk_quest : args.ctalk_quest, 
    res_context : args.res_context, 
    ws_no : args.ws_no, 
    state : args.state, 
    tag : args.tag || null, 
  }
}
module.exports.func = prepareApiFuncArgs