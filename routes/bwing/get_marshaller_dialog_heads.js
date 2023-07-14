'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler);

//System modules
const ds_conf = moduler.kvs.dialog;

/**
 * Get dialog heads.
 * @param {*} req 
 * @param {*} res 
 */
const getDialogHeads = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-Dialog-${client}-${conf.env.environment}`;
  
  const testing = req.query.testing || false;

  try {
    const rows = await ds_conf.getDialogHeads(ns, testing);
    const messages = (rows || []).map(row => {
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

    console.log(`=========${logiD} GET DIALOG HEADS client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded get dialog heads.",
      messages
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = getDialogHeads;