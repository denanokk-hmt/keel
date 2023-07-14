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
const { Buffer } = require('buffer')

//API limit for datastore
const property_size = 1500
const ds_api_limit = 10485760
/**
 * check buffer size. If data size is over, return true.
 * @param {string} data
 * @param {Number} size
 */
function checkBuffer(data, size){
  let bf = Buffer.from(JSON.stringify(data))
  return (bf.length >= size)? true : false
}

/**
 * convert from hierarchy to array rulebase by res
 * @param {Object} rulebase
 * @param {String} parent_id
 * @param {Number} resNumber
 * @param {Array} result
 */
function convertFromHierarchyToArray(rulebase, parent_id, resNumber, result, logiD, client) {

  for (let i = 0; i < rulebase.length; i++) {

    //validator
    if(!rulebase[i].message){
      throw {
        message: "message is null or undefined"
      }
    } else if (!rulebase[i].response && !rulebase[i].children){
      const err_message = (rulebase[i].children) ? "response" : "children"
      throw {
        message: `${err_message} is null or undefined`
      }
    }
    ++resNumber
    let response_id = `RB_${('000' + (resNumber)).slice(-4)}`

    //check property size
    if(
      checkBuffer(parent_id, property_size) ||
      checkBuffer(response_id, property_size) ||
      checkBuffer((rulebase[i].message || ""), property_size) ||
      checkBuffer((rulebase[i].response || ""), property_size) ||
      checkBuffer((rulebase[i].condition || ""), property_size) ||
      checkBuffer((rulebase[i].scenario?.comment || ""), property_size) ||
      checkBuffer((rulebase[i].scenario?.title || ""), property_size) ||
      checkBuffer((rulebase[i].content || ""), property_size)
      ) {
      console.error(`=========${logiD} FAILED POST RULEBASE LARGER THAN 1500 bytes client:${client}===========`)
      throw {
        message: "The value of property is longer than 1500 bytes"
      }
    }

    result.push({
      "parent_id": parent_id,
      "response_id": response_id,
      "message": rulebase[i].message,
      "response": rulebase[i].response || null,
      "conditions": rulebase[i].condition || null,
      "content": rulebase[i].content ? JSON.stringify(rulebase[i].content) : null,
      "scenario": rulebase[i].scenario || {},
    })
    
    if(rulebase[i].children && rulebase[i].children.length > 0){
      resNumber = convertFromHierarchyToArray(rulebase[i].children, response_id, resNumber, result)
    }
  }
  return resNumber
}
/**
 * Register rulebase with JSON.
 * @param {*} req 
 * @param {*} res 
 */
const postRulebase = async (req, res) => {
  const logiD = req.logiD
  //Set namespace
  const client = req.baseUrl.split("/")[2]
  const ns = `${conf.env.kvs.service}-Rulebase-${client}-${conf.env.environment}`

  let resNumber = 0
  const result = []
  const content = req.body.content
  const rulebases = content.filter(obj => obj?.type !== 'comment')
  const comment = content.find(obj => obj?.type === 'comment')?.message
  try {
    convertFromHierarchyToArray(rulebases, null, resNumber, result, logiD, client) 
  } catch (err) {
    console.error(`=========${logiD} FAILED POST RULEBASE client:${client}===========`)
    throw err
  }

  if(checkBuffer(result, ds_api_limit)) {
    console.error(`=========${logiD} FAILED POST RULEBASE DUE TO OVER 10MB SIZE client:${client}===========`)
    throw {
      message: "failed post rulebase due to over 10MB size."
    }
  }

  await ds_conf.updateRulebases(ns, result, client, comment, logiD).catch((err=>{throw err}))
  
  console.log(`=========${logiD} POST RULEBASE client:${client}===========`)
  const resMessages = {
    type: "API",
    status_code: code.SUCCESS_ZERO,
    status_msg: "Succeeded to register rulebases."
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = postRulebase