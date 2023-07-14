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
 * @param {String} parent_id
 */
function convertFromArrayToHierarchy(rulebase, parent_id) {
  const result = []
  const checkRulebase = rulebase.filter(rb => rb.parent_id == parent_id)

  for (let i = 0; i < checkRulebase.length; i++) {
    
    let messageTypeContent = checkRulebase[i].content && typeof checkRulebase[i].content === 'string' ? JSON.parse(checkRulebase[i].content) : {}

    result.push({
      message: checkRulebase[i].message,
      parent_id: checkRulebase[i].parent_id,
      response: checkRulebase[i].response || null,
      response_id: checkRulebase[i].response_id,
      content: messageTypeContent,
      scenario: checkRulebase[i].scenario_id ? {
        id: checkRulebase[i].scenario_id,
        item: checkRulebase[i].scenario_title,
        comment: checkRulebase[i].scenario_comment,
        is_hide: checkRulebase[i].scenario_is_hide
      } : {},
      children: convertFromArrayToHierarchy(rulebase, checkRulebase[i].response_id),
    })
  }
  return result
}

/**
 * Flagging rulebase.
 * @param {*} req 
 * @param {*} res 
 * @param {*} params 
 */
const getRulebase = async (req, res) => {
  const logiD = req.logiD
  //Set namespace
  const client = req.baseUrl.split("/")[2]
  const ns = `${conf.env.kvs.service}-Rulebase-${client}-${conf.env.environment}`
  
  const rulebase = await ds_conf.getRulebases(ns, logiD).catch(err => { throw err })
  //sort by response_id
  rulebase?.result?.sort(function (a, b) {
    // ignore upper and lowercase
    let a_response_id = a.response_id.toUpperCase()
    let b_response_id = b.response_id.toUpperCase()
    if (a_response_id > b_response_id) {
      return 1;
    } else {
      return -1;
    }
  })
  const messages = convertFromArrayToHierarchy(rulebase?.result, null)

  // insert first comment
  messages.push({
    type: "comment",
    message: rulebase?.comment,
    parent_id: null,
    response: null,
    response_id: null,
    scenario: {},
    children: []
  })

  console.log(`=========${logiD} GET RULEBASE client:${client}===========`)
  const resMessages = {
    type: "API",
    status_code: code.SUCCESS_ZERO,
    status_msg: "Succeeded get rulebaseFAQ.",
    messages
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = getRulebase