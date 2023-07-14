'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.rulebase

/**
 * convert from array to hierarchy rulebase Objects
 * @param {Object} rulebase 
 */
function searchScenario(rulebase) {
  const result = []

  for (let i = 0; i < rulebase.length; i++) {
    if (rulebase[i].scenario_id) {
      result.push({
        id: rulebase[i].scenario_id,
        title: rulebase[i].scenario_title,
        comment: rulebase[i].scenario_comment,
        is_hide: rulebase[i].scenario_is_hide
      })
    }
  }
  return result
}

/**
 * Flagging rulebase.
 * @param {*} req 
 * @param {*} res 
 * @param {*} params 
 */
const getRulebaseScenario = async (req, res) => {
  const logiD = req.logiD
  //Set namespace
  const client = req.baseUrl.split("/")[2]
  const ns = `${conf.env.kvs.service}-Rulebase-${client}-${conf.env.environment}`
  
  const rulebase = await ds_conf.getRulebases(ns, logiD).catch(err => { throw err })
  const messages = searchScenario(rulebase?.result)

  console.log(`=========${logiD} GET RULEBASE SCENARIO client:${client}===========`)
  const resMessages = {
    type: "API",
    status_code: code.SUCCESS_ZERO,
    status_msg: "Succeeded get rulebaseFAQ scenario.",
    messages
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = getRulebaseScenario