'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.operator
const request = require('./get_user');


/**
 * Get operator from datastore or OKSKY
 * @param {*} data
 */
const getOperator = async (param) => {
  console.log("================= GET OPERATOR ", JSON.stringify(param))
  try {
    //Get operator
    let opData = null
    let operator = await ds_conf.getOperatorByUid(param.namespace, param.op_ope_uid)
    if(!operator || !operator.length){
      let res = await request.get_user(param.client, param.op_ope_uid)
      let attributes = res.attributes
      await ds_conf.createOperator(param.namespace, param.op_ope_uid, {
        system: conf.env_client.operator[param.client].system_name,
        name: attributes.name,
        full_name: attributes.full_name,
        default_avatar_url: attributes.default_avatar_url,
        avatar_url: attributes.avatar_url,
      })
      operator = await ds_conf.getOperatorByUid(param.namespace, param.op_ope_uid)
    }
    if(operator && operator.length){
      opData = operator[0]
    }
    return opData;
  } catch(err) {
    throw new Error(err);
  }
}

module.exports.func = getOperator;