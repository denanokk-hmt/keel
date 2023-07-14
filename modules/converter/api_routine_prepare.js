'use strict'

//config
const conf = require(REQUIRE_PATH.configure);

/**
 * For Array value converter function arg setting.
 * @param {*} routine 
 * @param {*} args 
 * @param {*} response 
 */
const prepareConverterFuncArgs = (routine, args={}, response) => {

  //Check conversationAPI --> output format
  const output_format = (routine.output_format)? routine.output_format : conf.api_conn.conversationAPI.module

  let response_state
  for (let idx in routine.module_name) {
    if (routine.module_name[idx] === output_format) {
      response_state = idx
      break;
    }
  }

  return {
    output_format : output_format,
    convert_values : response[routine.buff_state],
    target_response : response[response_state],
  }
}
module.exports.func = prepareConverterFuncArgs