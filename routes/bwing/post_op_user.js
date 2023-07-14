'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.operator
const op_system = conf.op_system


/**
 * Receive message from Operator system
 * @param {*} req
 * @param {*} res
 * @param {*} params
 */
const postOpUser = async (req, res, params) => {

  const logiD = params.logiD
  console.log(`=========${logiD} RECEIVE OP USER body ===========`, JSON.stringify(req.body));

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns

  /////////////////////////////
  //Get & Set Session
  //Get Operator by op_ope_uid of params

  //Get Operator from operator system
  const opParam = {client: client, namespace: ns, op_ope_uid: params.op_ope_uid};
  const operator = await op_system[client].get_operator.func(opParam)
    .catch(err => {
      throw new Error(err);
    });
  let result = null
  if(operator){
    //put Operator with op_ope_uid
    result = await ds_conf.putOperator(
      ns, 
      operator, 
      {
        system: params.system,
        name : params.name,
        full_name : params.full_name,
        avatar_url : params.avatar_url,  
      }
    );
  }
  console.log(`========${logiD} PUT OPERATOR IN DATASTORE `, JSON.stringify(result));

  //Response
  express_res.func(res, result)

  //Return result
  return 'post op user success';
};
module.exports.func = postOpUser;