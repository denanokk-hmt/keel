'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//[System modules]
const op_system = conf.op_system


/**
 * Send messsage to operator system
 * @param {*} req 
 * @param {*} res
 * @param {*} params
 */
const postOpMessage = async (req, res, params) => {

  const logiD = req && req.body.logiD;
  console.log(`=========${logiD} POST OP MESSAGE===========`);

  //Set client
  const client = req.client
  req.body.client = client

  let results = await op_system[client].post_message.post_message(req.body);

  return "post message to operator system success";
};
module.exports.func = postOpMessage;