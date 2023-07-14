'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//[System modules]
const op_system = conf.op_system


/**
 * Login to Operator system
 * @param {*} req
 * @param {*} res
 */
const postOpLogin = async (req, res, params = {}) => {

  const logiD = req && req.body.logiD;
  console.log(`=========${logiD} POST OP LOGIN===========`);

  //Set client
  const client = req.client

  //OKSKY login
  const login = await op_system[client].post_login.login(client);
  console.log("========= OP access_token ======== ", login.result.access_token);

  return 'oksky login success';
};

module.exports.func = postOpLogin;