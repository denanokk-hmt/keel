'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs


/**
 * Update User Status
 * @param {*} req 
 * @param {*} res 
 */
const postUserStatusUpdate = async (req, res, params) => {

  const logiD = req.body.logiD;
  console.log(`=========${logiD} KEEL USER_STATUS UPDATE===========`);

  const token  = params.token;
  const status = params.status;

  //Set datastore namespace
  const ns = req.ns;
  const sessions = await ds_conf.session.getBySessionId(ns, token);
  if (!sessions || !sessions.length) {
    express_res.funcErr(res, status.ERR_A_SYSTEM_990, code.ERR_A_SYSTEM_990);
    return 'Session Error.';
  }
  const currentSession = sessions[0];

  let testUserState = await ds_conf.user.putUserStatus(ns, currentSession.rid, currentSession.uid, params.status);

  //Result
  const result =  {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "User Status update Success",
  }

  //Response
  express_res.func(res, result)

  return 'success';
};
module.exports.func = postUserStatusUpdate;
