'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const google_translate_langage = conf.env_client.google_translate_langage

/**
 * For google traslate api function arg setting.
 * @param {*} routine 
 * @param {*} args 
 * @param {*} response 
 */
const prepareApiFuncArgs = (routine, args={}, response) => {

  //if response is nothing, case of "in", And 1 quest. customer --> bot
  //Other case of out. bot --> customer
  const inOrOut = (Object.keys(response).length === 0)? 'in' : 'out';
  
  if (inOrOut === 'in') {
    return {
      talk_type : args.ctalk_quest.talk_type,
      texts : args.ctalk_quest.message,
      source_lang : google_translate_langage[args.client][inOrOut].source_lang,
      target_lang : google_translate_langage[args.client][inOrOut].target_lang
    }
  } else {
    let quests = []
    for (let idx in response[routine.buff_state].output.responded.talk) {
      quests.push(response[routine.buff_state].output.responded.talk[idx].content.message)
    }
    return {
      talk_type : args.ctalk_quest.talk_type,
      texts : quests,
      source_lang : google_translate_langage[args.client][inOrOut].source_lang,
      target_lang : google_translate_langage[args.client][inOrOut].target_lang
    }
  }

}
module.exports.func = prepareApiFuncArgs