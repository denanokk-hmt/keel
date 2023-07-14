'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.sysmsg


/**
 * Flagging coupons.
 * @param {*} req 
 * @param {*} res 
 * @param {*} params 
 */
const getSysmsg = async(req, res) => {
  const client = req.client
  const ns = req.ns

  const result = await ds_conf.getSysmsg(ns)  // Is it need to care exception?

  const resMessages = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "Succeeded to get SYSMSGs.",
    messages: result
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = getSysmsg