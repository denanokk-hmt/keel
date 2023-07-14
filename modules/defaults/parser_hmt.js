'use strict'

//config
const conf = require(REQUIRE_PATH.configure);

//System modules
const data_linkage = require(`../linkage/getter`)
const arranger = require(`./arranger`)

//Linkage data name
let data_name
if (conf.env.linkage.data) {
  data_name = conf.env.linkage.data.name
}


/**
 * ///////////////////////////////////////////////////
 * Watsonのレスポンスの結果を取得
 * @param {*} answer 
 */
const parseResponse = (answer) => {
  return new Promise(function(resolve, reject) {
    let results = []

    //ログ用オリジナルレスポンス
    answer.org_answer = answer.output.text

    answer.output.text = answer.output.text.split('|')

    //Arrangerでインテンツ、エンティティなどの結果を拾わせる
    //メッセージ分割のためのループ
    let text
    const exp = /R[0-9]+_*[0-9]+_*[0-9]/;  //Rと数値：R101
    for(let idx in answer.output.text) {
      //Linkage judge
      if (String(answer.output.text[idx]).match(exp) && data_name) {
        text = data_linkage.getResponse(answer.output.text[idx], data_name)
        if (!text) {
          text = conf.default_message.data_linkage_error
        }
        //Linkage response 
        answer.output.text[idx] = text
      }
      //Arrange response
      results.push(arranger.resultArrange(answer, Number(idx)));
    }
  
    resolve(results)
  });
};

/**
 * ///////////////////////////////////////////////////
 * Watson API エラーの場合の結果を補完
 * @param {*} answer 
 */
const complementErrCase = answer => {
  return new Promise(function(resolve, reject) {
    let results = []
    for(let idx in answer) {
      results.push(arranger.convertErrors(answer[idx])); //Arrange
    }
    resolve(results)
  })
}

/**
 * ///////////////////////////////////////////////////
 * 最終整形
 * @param {*} cmsg 
 * @param {*} answer 
 */
const arrangeForOutput = (cmsg, answer, watson) => {
  return new Promise(function(resolve, reject) {
  
    //Convert message for Bot talking
    let num = 0
    let messages = []
    for(let idx in answer) {
      messages.push(arranger.convertBtalk(answer[idx], ++num));
    }

    //Arrange responded
    const results = arranger.responded(answer, messages, num)

    //Logging 
    let logOutStr
    if (cmsg != conf.config.no_output_words) {
      const uuid = results.responded.response_context.uuid
      const answer = results.responded.org_answer.replace(/\|/g,',')
      let type_msg = []
      for (let i in results.btalk.messages) {
        type_msg[i] = `type:${results.btalk.messages[i].talk.type}-message:${results.btalk.messages[i].talk.content.message}`
      }
      const intents = JSON.stringify(results.responded.intents)
      const entities = JSON.stringify(results.responded.entities)
      const ws = (watson)? watson.Environment : 'not_use'
      logOutStr = `uuid:${uuid}|quest:${cmsg}|answer:${answer}|type-message:${JSON.stringify(type_msg)}|intents:${intents}|entities:${entities}|WS:${ws}`;
    }

    resolve ({
      status_msg : 'Success',
      results : results,
      logOutStr : logOutStr,
    })
  })
}

/**
 * ///////////////////////////////////////////////////
 * Parse for WhatYa
 * @param {*} cmsg 
 * @param {*} answer 
 * @param {non} watson
 */
const parser = async (cmsg, answer, watson) => {
  return await parseResponse(answer)
    .then(results => {
      return complementErrCase(results)
    })
    .then(results => {
      return arrangeForOutput(cmsg, results, watson)
    })
    .catch(err => {
      throw new Error(err.message)
  });
}
module.exports.func = parser
