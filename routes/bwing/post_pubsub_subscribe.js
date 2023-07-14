'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//express
const express_res = conf.express_res

//System modules
const pubsub = require(`${REQUIRE_PATH.modules}/pubsub/subscribe`);
const pubsub_publish = require(`${REQUIRE_PATH.modules}/pubsub/publish`);
const subexec = require(`${REQUIRE_PATH.modules}/pubsub/subscriber_setter`);


/**
 * Pubsub message Pull Subscribe
 * @param {*} req 
 * @param {*} res 
 * @param {*} paraams { data : JSON{} }
 */
const postPubsubPushSubscribe = async (req, res, params) => {

  const logiD = req.body.logiD

  //Set client
  const client = req.client

  //publish to pubsub
  const decode = Buffer.from(params.data, 'base64');
  const data = decode.toString('utf8')

  console.log(`=========${logiD} SUBSCRIBE DATA`, data)

  //受信したメッセージによって、処理先を振り分ける
  //ex: send_msg_2op --> subscriber_setterにsend_msg_2opを登録 & require
  //    publish時に、data.exec = "send_msg_2op"を指定
  const parse_data = JSON.parse(data)
  console.log(`=========${logiD} SUBSCRIBER FUNC`, parse_data.exec)
  const postRes = await subexec[parse_data.exec][client].func(parse_data)
    .catch(err => {
      throw new Error(err)
    })

  let result = {};  
  if(postRes.hasOwnProperty('approval') && !postRes.approval){
    switch(postRes.status_code){
      case 907:
      case 908:
        result = await handleOpSystemErr(logiD, postRes, client);
        break;
      default:
        result = postRes;
    }
  }else{
    result = data;
  }
  
  //Response
  express_res.func(res, result)

  return 'success';
};
module.exports.push = postPubsubPushSubscribe;

/**
 * Pubsub message Pull Subscribe
 * @param {*} req 
 * @param {*} res 
 * @param {*} paraams
 */
const postPubsubPullSubscribe = async (req, res, params) => {

  const logiD = req.body.logiD

  //publish to pubsub
  const result = await pubsub.listenMessages(params.subscription)

  //Response
  express_res.func(res, result)

  return 'success';
};
module.exports.pull = postPubsubPullSubscribe;

//Error handling for Oksky OP System Error on duplicate message
const handleOpSystemErr = async (logiD, errObj, client) => {
  let result = {
    rid: errObj.rid,
    type: errObj.type,
    status_code: errObj.status_code,
    status_msg: errObj.status_msg,
    qty: 1,
    messages: [{
      mtype: "system",
      talk: {
        type: "text",
        content: {
          system_message: "[以下のメッセージが投稿出来ませんでした。]",
          message: errObj.message
        }
      }
    }]
  };

  //send to cabin topic to return to cockpit
  const topic = `projects/${conf.google_prj_id}/topics/cabin_${client}_${conf.env.environment}`

  console.log(`========${logiD} PUBLISH DATA VALUE `, JSON.stringify(result));
  await pubsub_publish.publishMessage(topic, JSON.stringify(result))

  return result;
}