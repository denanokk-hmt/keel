'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler);

//System modules
const ds_conf = moduler.kvs.message_container;
const { Buffer } = require('buffer');

const types  = require(`${REQUIRE_PATH.modules}/messages/types`);

/**
 * Register message container with JSON.
 * @param {*} req 
 * @param {*} res 
 */
const postMessageContainer = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-MessageContainer-${client}-${conf.env.environment}`;

  const messages  = req.body.content.messages || [];
  const committer = req.body.committer || null;

  const messageTypes = Object.values(types);
  for (let msg of messages) {
    // check to message type is valid
    if (messageTypes.indexOf(msg.talk?.type) === -1) {
      console.error(`=========${logiD} FAILED POST MESSAGE CONTAINER INVALID MESSAGE TYPE type:${msg.talk?.type}===========`);
      throw {
        message: "Invalid message type. " +  msg.talk?.type
      };
    }

    // set head flag, if type is message_container.
    msg.head = (msg.talk?.type === types.MSG_CONTAINER);

    // set committer
    msg.committer = committer;

    // stringify talk object
    msg.talk = msg.talk ? JSON.stringify(msg.talk) : null;

  }

  try {
    await ds_conf.updateMessageContainer(ns, client, messages);
    console.log(`=========${logiD} POST MESSAGE CONTAINER client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded to register message container."
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = postMessageContainer;