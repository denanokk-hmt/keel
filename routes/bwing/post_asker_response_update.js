'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.responsies
const parser = require(`${REQUIRE_PATH.modules}/linkage/csv/message_parser`)


/**
 * Update Asker Response
 * @param {*} req 
 * @param {*} res 
 */
const postAskerResponseUpdate = async (req, res) => {

  const logiD = req.body.logiD
  console.log(`========= KEEL POST ASKER RESPONSE UPDATE ${logiD}===========`)

  //Set clinet
  const client = req.client

  //Set update asker response body and request 
  const params = {
    "client" : client,
    "version" : conf.version,
    "token" : conf.conf_keel.token,
    "logiD" : logiD,
    "response" : req.body.response,
    "batch_id" : req.body.batch_id,
    "header_line": req.body.header_line,
  }

  //Update response
  let resMessages;
  await updateResponse(params)
  .then(result => {
    console.log(`====UPDATE RESULT:${logiD}: ${JSON.stringify(result)}`)
    //Response contents
    if(JSON.parse(req.body.response).length === result){
      resMessages = {
        type : "API",
        insert_row: result,
        batch_id: req.body.batch_id,
        status_code : code.SUCCESS_ZERO,
        status_msg : `Success Update Asker Answers response.`,
        client : `${req.body.client}`,
        udt : new Date(),
      }
      console.log(`====UPDATED ASKER:${logiD}: [INFO]|[ASKER]|${JSON.stringify(result)}`)
    } else {
      resMessages = {
        type : "API",
        insert_row: result,
        batch_id: req.body.batch_id,
        status_code : code.ERR_A_SYSTEM_990,
        status_msg : code.ERR_A_SYSTEM_990 + ' Failure Update Asker Answers response. Failed to insert all received responses.',
        client : `${req.body.client}`,
        udt : new Date(),
      }
      console.log(`====NO UPDATE ASKER:${logiD}: ${JSON.stringify(params)}`)
    }
  
    //Response
    express_res.func(res, resMessages)
    return 'success';
  })
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'response update error.'
  });
};
module.exports.func = postAskerResponseUpdate;

/**
 * Update response
 * @param {*} client
 */
const updateResponse = async (params) => {
  const client = params.client;
  console.log(`=========ASKER RESPONSE UPDATE ${client}===========`)

  //Get responses coming from
  let gas_response = JSON.parse(params.response);
  console.log("=====DEBUG ", JSON.stringify(params))
  let gas_header = JSON.parse(params.header_line);
  let response_data = {}
  if (gas_response.length) {
    response_data[client] = parser.parseData(gas_response, gas_header)
  } else {
    console.log('No data found.');
    throw new Error('No data found.')
  }

  //Set namespace
  const namespace = `${conf.env.kvs.service}-Asker-${client}-${conf.env.environment}`

  //Insert newest response
  let insert_row = 0;
  let insert = []
  let result

  console.log(`=========== ASKER RESPONSE INSERT =========== ${namespace}`)
  try {
    for(let idx in response_data[client]) {
      insert[insert_row++] = await ds_conf.insertResponse(namespace, client, idx, JSON.stringify(response_data[client][idx]), params.batch_id);
    }
    result = insert.length;
  } catch(err) {
    throw new Error(err.message)
  }

  return result;
}