'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//System modules
const data_linkage = require(`../linkage/getter.js`)

//Linkage data name
let data_name
if (conf.env.linkage.data) {
  data_name = conf.env.linkage.data.name
}

/**
 * 
 * @param {*} response 
 */
const getRecommends = response => {
  try {
    //試作でCSVで連携したItem_Image_SliderのR9204レスを接続させてみた  

    //Get Linkage response
    const linkage_response = data_linkage.getResponse('R9204', data_name)
    
    //Set recommend message
    let message = "Outer recommends, for <?$user_name?>"

    //Replace user name in message
    let context_user_name = 'you.'
    if (response.responded.response_context) {
      if (response.responded.response_context.user_name) {
        context_user_name = response.responded.response_context.user_name;
      }
    }
    message = message.replace(/\<\?\$user_name\?\>/, context_user_name)
    
    response.btalk.messages[0].talk = linkage_response
    response.btalk.messages[0].talk.content.message = message

    return response
  } catch (err) {
    throw new Error(err)
  }  
}
module.exports.getRecommends = getRecommends
