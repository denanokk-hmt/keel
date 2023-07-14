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
 * Register message container with JSON.
 * @param {*} req 
 * @param {*} res 
 */
const postDialog = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-Dialog-${client}-${conf.env.environment}`;

  const messages  = req.body.content.messages || [];
  const committer = req.body.committer || null;

  for (let msg of messages) {
    // set committer
    msg.committer = committer;

    // stringify talk object
    msg.talk = msg.talk ? JSON.stringify(msg.talk) : null;  
  }

  try {
    await ds_conf.updateDialog(ns, client, messages);
    console.log(`=========${logiD} POST DIALOG client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded to register dialog."
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = postDialog;