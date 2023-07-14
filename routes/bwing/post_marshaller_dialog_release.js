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

//validator
const msg_module = require(`${REQUIRE_PATH.modules}/messages/`)
const validator = msg_module.validator

/**
 * Register message container with JSON.
 * @param {*} req 
 * @param {*} res 
 */
const postDialogRelease = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-Dialog-${client}-${conf.env.environment}`;

  const testing_rev = req.body.content?.testing_rev || null;
  const committer = req.body.committer || null;

  try {
    const result = await ds_conf.releaseDialog(ns, client, testing_rev, committer);
    if (!result) {
      console.log(`=========${logiD} POST DIALOG RELEASE wrong rev:${testing_rev} client:${client}===========`);
      // revが異なっていた場合に何返すか？
      const resMessages = {
        type: "API",
        status_code: code.SUCCESS_ZERO,
        status_msg: "wrong rev. skip release dialog."
      };
    
      express_res.func(res, resMessages);
      return "Success";  
    }
    console.log(`=========${logiD} POST DIALOG RELEASE client:${client}===========`);
    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: "Succeeded to release dialog."
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = postDialogRelease;