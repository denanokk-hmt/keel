'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//express
const express_res = conf.express_res

//System modules
const pubsub = require(`${REQUIRE_PATH.modules}/pubsub/publish`);


/**
 * Pubsub message Publish
 * @param {*} req 
 * @param {*} res 
 * @param {*} paraams
 */
const postPubsubPublish = async (req, res, params) => {

  const logiD = req.body.logiD

  //publish to pubsub
  const result = await pubsub.publishMessage(params.topic, params.data)

  //Response
  console.log(`=========published result`, JSON.stringify(result))
  express_res.func(res, result)

  return 'success';
};
module.exports.func = postPubsubPublish;