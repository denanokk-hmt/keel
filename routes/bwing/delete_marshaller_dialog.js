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

const types  = require(`${REQUIRE_PATH.modules}/messages/types`);

//validator
const msg_module = require(`${REQUIRE_PATH.modules}/messages/`)
const validator = msg_module.validator

/**
 * Register message container with JSON.
 * @param {*} req 
 * @param {*} res 
 */
const deleteDialog = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-Dialog-${client}-${conf.env.environment}`;

  const messages  = req.body.content.messages || [];

  try {
    const result = await ds_conf.deleteDialog(ns, messages);
    console.log(`=========${logiD} DELETE DIALOG client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: `Succeeded delete dialog.result: ${result.length}`,
      deleted: result,
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = deleteDialog;