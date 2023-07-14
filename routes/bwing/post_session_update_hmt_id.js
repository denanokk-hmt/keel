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
const hmt_id = require(`${REQUIRE_PATH.modules}/bwing/hmt_id`);


/**
 * Replace session, lost pw or session expired.
 * @param {*} req 
 * @param {*} res 
 */
const postSessionUpdateWhatyaId = async (req, res) => {

  const logiD = req.body.logiD;
  console.log(`=========${logiD} KEEL SESSION UPDATE WHATYA ID===========`);

  //Set client
  const client = req.client  ;

  //Get req data
  let token = req.body.token;
  console.log(`=========${logiD} TOKEN: ${token}`);

  //Set datastore namespace
  const ns = req.ns;

  const sessions = await ds_conf.session.getBySessionId(ns, token);
  if (!sessions || !sessions.length) {
    express_res.funcErr(res, status.ERR_A_SYSTEM_990, code.ERR_A_SYSTEM_990);
    return 'Session Error.';
  }
  const currentSession = sessions[0];
  const op_session = currentSession.op_session || hmt_id.generate(currentSession.uid, currentSession.rid);
  if (!currentSession.op_session) {
    await ds_conf.session.putSession({
      ns,
      session: currentSession,
      addProp: {
        ...currentSession,
        op_session: op_session,
      }
    });
  }

  //Result
  const result =  {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "Session update hmt_id Success",
    token : token,
    hmt_id : op_session,
  }

  //Response
  express_res.func(res, result)

  return 'success';
};
module.exports.func = postSessionUpdateWhatyaId;
