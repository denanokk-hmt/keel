'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;
const status = conf.status

//express
const express_res = conf.express_res;

//moduler
const moduler = require(REQUIRE_PATH.moduler);

//System modules
const ds_conf = moduler.kvs;

/**
 * Get unread operator message count
 * @param {*} req 
 * @param {*} res
 */
const getOpUnread = async (req, res, params) => {

  const logiD = req.body.logiD;
  console.log(`=========${logiD} GET OP UNREAD ===========`);

  //Set client
  const client = req.client;
  const token  = params.token;
  const qty    = Number(params.qty) || 10;

  //Get session
  const ns = req.ns;
  const sessions = await ds_conf.session.getBySessionId(ns, token)
  .catch(err =>{ throw err; });
  if (!sessions || !sessions.length) {
    throw new Error({
      type: "OAuth",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : status.ERR_A_SYSTEM_990,
      approval : false,
    });
  }
  const rid = sessions[0].rid;
  const uid = sessions[0].uid;

  //Get current user status
  const [current_status] = await ds_conf.user.getUserStatus(ns, uid)
  .catch(err =>{ throw err; });
  let mark_read_op = Number(current_status?.mark_read_op);

  let unread_cnt = 0;
  //mark_read_opが未設定の場合は件数の判定は行わない（０件を返却）
  if (mark_read_op) {
    //Get Messages
    const messages = await ds_conf.message.getMessages(ns, rid, mark_read_op, 'gt', qty, 'operator')
    .catch(err =>{ throw err; });

    unread_cnt = messages?.length;
  }

  const result = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "success get op unread.",
    qty: unread_cnt || 0,
    messages: [],
  };  

  //Response
  express_res.func(res, result);

  return result;
};
module.exports.func = getOpUnread;
