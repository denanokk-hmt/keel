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
 * Get non deleted dialog.
 * @param {*} req 
 * @param {*} res 
 */
const getDialog = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-Dialog-${client}-${conf.env.environment}`;
  
  const testing = req.query.testing || false;

  try {
    const rows = await ds_conf.getDialog(ns, testing);
    const messages = (rows || []).map(row => {
      const talk = row.talk ? JSON.parse(row.talk) : null;
      return {
        ...row,
        talk
      };
    });
    console.log(`=========${logiD} GET Dialog client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded get dialog.",
      messages
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = getDialog;