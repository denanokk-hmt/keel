const coupon = require(`./coupon`);
const analysis = require(`./analysis`);

/*
params: {
  :
  namespace: "[kvs用のnamespace]",
  hmt_id: "[ユーザのhmt_id]",
  wy_data:   "[cockpitから渡されたパラメータ]",
}
*/
/**
 * modify message
 * @param {object} params
 * @param {object} message 
 */
const modifyMessages = async ({ns, hmt_id, params, messages}) => {
  /***** Special treat for WhatYa Events *****/
  let result = {
    messages: [],
    eventlogs: []
  };
  for (let idx in messages) {    
    let message = {
      ...messages[idx],
      wy_event: params.wy_event,
    };
    const type = message.talk.type;
    let hideMessage = false;

    const messageList = [];
    // message
    switch (type) {
      case "text":
        // [&-&]が含まれる場合はメッセージを分割
        // ※分割された値は message ではなく messageList に格納し、
        //  分割されない場合、または分割後に有効な値が存在しない場合はそのまま message を使用
        const txts = message.talk?.content?.message?.split(/\\n*&[-]&\\n*/g);
        if (txts && txts.length > 1) {
          for (let txt of txts) {
            // 子孫のオブジェクトもコピーする必要があるため、obj->str->objの変換を行う
            let msg = JSON.parse(JSON.stringify(message));
            msg.talk.content.message = txt;
            messageList.push(msg);
          }
        }
        break;
      case "req_login":
        if (!message.talk.content.query.origin) {
          message.talk.content.query.origin = params.current_url;
        }
        if (!message.talk.content.query.wy_event) {
          message.talk.content.query.wy_event = params.wy_event;
        }
        if (!message.talk.content.query.wy_opn) {
          message.talk.content.query.wy_opn = params.wy_opn;
        }
        break;
      case "coupon_slider":
      case "locked_coupon_slider":
        message = await coupon.coupon_slider({ns, hmt_id, params, message});
        break;
      case "own_coupon_slider":
        message = await coupon.own_coupon_slider({ns, hmt_id, params, message});
        break;
      case "coupon":
        message = await coupon.coupon_details({ns, hmt_id, params, message});
        break;

      case "analysis_result":
        message = await analysis.analysis_result({ns, hmt_id, params, message});
        hideMessage = true;   // メッセージ非表示
        break;

      default:
        // 変更処理なし
        break;
    }
    if (!hideMessage) {
      if (messageList.length > 0) {
        result.messages = result.messages.concat(messageList);
      } else {
        result.messages.push(message);
      }
    }
    // append event log
    if (message.talk.eventLog) {
      console.log("Eventlog found. ", JSON.stringify(message.talk.eventLog));
      result.eventlogs.push({
        mtime: message.mtime,
        mtype: "bot",
        talk: {
          type: "eventlog",
          content: {
            ...message.talk.eventLog,
            remark: {
              ...message.talk.content,   // 元メッセージのコンテンツをRemarkに格納
            },
          }
        }
      });
    }
  }
  return result;
};
module.exports.modifyMessages = modifyMessages
