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

const types  = require(`${REQUIRE_PATH.modules}/messages/types`);

/**
 * Get message container parents.
 * @param {*} req 
 * @param {*} res 
 */
const getMessageContainerParents = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-MessageContainer-${client}-${conf.env.environment}`;
  
  try {
    const rows = await ds_conf.getMessageContainerHeads(ns);
    const results = (rows || []).map(row => {
      const talk = row.talk ? JSON.parse(row.talk) : null;
      return {
        response_id: row.response_id,
        title:       row.title,
        talk: {
          type:    talk?.type,
          message: talk?.message,
        },  
      };
    });
    const messages = results.filter(row => {
      if (row.dflg) { return false; }
      return (row.talk?.type === types.MSG_CONTAINER);
    });
    console.log(`=========${logiD} GET MESSAGE CONTAINER PARENTS client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded get message container parents.",
      messages
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = getMessageContainerParents;