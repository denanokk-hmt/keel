'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler);

//System modules
const op_system = conf.op_system;
const ds_conf = moduler.kvs;

/**
 * Set MarkRead to Operator system
 * @param {*} req 
 * @param {*} res
 */
const putOpMarkRead = async (req, res, params) => {

  const logiD = req.body.logiD;
  console.log(`=========${logiD} PUT OP MARK READ ===========`);

  //Set client
  const client = req.client;
  const token  = params.token;

  const mtime  = Number(params.mtime) || (new Date).getTime();  //既読時刻が未設定の場合は現在時刻を設定

  let result = {
    approval: true
  };
  if (op_system[client]?.mark_read) {
    //CTのOPシステムが設定されている場合は既読処理を行う
    result = await op_system[client].mark_read.func(client, token)
    .catch(err => { throw err; });
  }

  if (result?.approval) {
    //Get session
    const ns = req.ns;
    const sessions = await ds_conf.session.getBySessionId(ns, token)
    .catch(err =>{ throw err; });
    if (!sessions || !sessions.length) {
      result = {
        type: "OAuth",
        status_code : code.ERR_A_SYSTEM_990,
        status_msg : status.ERR_A_SYSTEM_990,
        approval : false,
      };
      throw new Error(result);
    }
    const rid = sessions[0].rid;
    const uid = sessions[0].uid;
  
    //Get current user status
    const [current_status] = await ds_conf.user.getUserStatus(ns, uid)
    .catch(err =>{ throw err; });
    const mark_read_op = Number(current_status?.mark_read_op);

    //mark_read_opが未設定、または指定値より小さい場のみ更新
    if (!mark_read_op || (mtime > mark_read_op)) {
      //Update user status
      await ds_conf.user.putUserStatus(ns, rid, uid, { mark_read_op: mtime })
      .catch(err =>{ throw err; });
    }

    result = {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : "success put mark read to op.",
      qty: 0,
      messages: [],
    };
  }

  //Response
  express_res.func(res, result);

  return result;
};
module.exports.func = putOpMarkRead;
