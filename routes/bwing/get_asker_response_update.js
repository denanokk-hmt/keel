'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const spreadsheet_conf = conf.asker_sheet_config

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.responsies
const spreadsheet = require(`${REQUIRE_PATH.modules}/linkage/google/spreadsheet-reader`)


/**
 * Update Asker Response
 * @param {*} req 
 * @param {*} res 
 */
const getAskerResponseUpdate = async (req, res) => {

  const logiD = req.query.logiD
  console.log(`========= KEEL GET ASKER RESPONSE UPDATE ${logiD}===========`)

  //Set client
  const client = req.client

  //Asker response date insert to ds
  const result = await updateResponse(client)
  .catch(err => {
    console.log(err)
    throw new Error(err)
  })

  //Response
  express_res.func(res, result)
};
module.exports.func = getAskerResponseUpdate;


/**
 * Update response
 * @param {*} client
 */
const updateResponse = async (client) => {
  console.log(`=========ASKER RESPONSE UPDATE GET SPREADSHEET ${client}===========`)

  //Get responsies
  const range = spreadsheet_conf[client].response.range
  const data = await spreadsheet.funcResponse(client, spreadsheet_conf[client].response.id, range[0])
  .then(results => {
    return results
  })
  .catch(err => {
    throw new Error(err.message)
  });

  //Set namespace
  const namespace = `${conf.env.kvs.service}-Asker-${client}-${conf.env.environment}`

  console.log(`==${namespace}==`)

  //Get responsies
  const response = await ds_conf.getResponsies(namespace, client)
  .catch(err =>{
    throw new Error(err.message)
  })

  //Delete  response
  if (response.length) {
    await ds_conf.deleteResponseByAll(namespace)
    .catch(err =>{
      throw new Error(err.message)
    })
  }
  /*
  for(let idx in response) {
    if (response[idx]) {
      await ds_conf.deleteResponse(namespace, response[idx].response_id)
      .catch(err =>{
        throw new Error(err.message)
      })
    }
  }
  */

  //Insert newest response
  try {
    for(let idx in data) {
      ds_conf.insertResponse(namespace, client, idx, JSON.stringify(data[idx]))
      /*
      .catch(err =>{
        throw new Error(err.message)
      })
      */
    }
  } catch(err) {
    throw new Error(err.message)
  }

  console.log(`=========ASKER RESPONSE UPDATE INSERT(DONE) TO DS ${client}===========`)

  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `Success Update Asker Answers response.`,
    client : client,
    udt : new Date(),
  }
}
module.exports.updateResponse = updateResponse;
