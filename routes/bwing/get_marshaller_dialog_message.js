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
 * Get specific response of dialog.
 * @param {*} req 
 * @param {*} res 
 */
const getDialogMessage = async (req, res) => {
  const logiD = req.logiD;
  //Set namespace
  const client = req.baseUrl.split("/")[2];
  const ns = `${conf.env.kvs.service}-Dialog-${client}-${conf.env.environment}`;
  
  const testing = req.query.testing || false;
  try {
    const row = await ds_conf.getDialogMessage(ns, req.query.response_id, testing);
    let result;
    if (row?.response_id) {
      const talk = row?.talk ? JSON.parse(row.talk) : null;
      result = {
        response_id: row.response_id,
        title:       row.title,
        talk: {
          type:    talk?.type,
          message: talk?.message,
        },
      };
      console.log(`=========${logiD} GET DIALOG MESSAGE client:${client}===========`);
    }

    const resMessages = {
      type: "API",
      status_code: code.SUCCESS_ZERO,
      status_msg: result ? "Succeeded get dialog message." : "no result.",
      result
    };
  
    express_res.func(res, resMessages);
    return "Success";
  }
  catch (err) {
    throw err;
  }
};
module.exports.func = getDialogMessage;