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

/**
 * Get message container.
 * @param {*} req 
 * @param {*} res 
 */
const getMessageContainer = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-MessageContainer-${client}-${conf.env.environment}`;
  
  try {
    const rows = await ds_conf.getMessageContainer(ns);
    const messages = (rows || []).map(row => {
      const talk = row.talk ? JSON.parse(row.talk) : null;
      return {
        ...row,
        talk
      };
    });
    console.log(`=========${logiD} GET MESSAGE CONTAINER client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded get message container.",
      messages
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = getMessageContainer;