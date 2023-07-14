'use strict';

//config
const conf = require(REQUIRE_PATH.configure)
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.sysmsg


/**
 * Register new system message.
 * @param {*} req
 * @param {*} res
 * @param {*} params
 */
const RegSysmsg = async(req, res, params) => {
  const client = req.client
  const ns = req.ns
  const result = await ds_conf.updateSysmsg(ns, params) // Is it need to care exception?

  const resMessages = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "Succeeded to update SYSMSG.",
    messages: result,
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = RegSysmsg