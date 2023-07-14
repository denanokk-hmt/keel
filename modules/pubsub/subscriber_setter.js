'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const op_system = conf.op_system

//Operator sysytem へのメッセージ送信処理(send_message)を登録
let send_message = []
let send_message_disconnect = []
for(let idx in op_system) {
  send_message[idx] = op_system[idx].send_message
  send_message_disconnect[idx] = op_system[idx].send_message_disconnect
}
module.exports.send_msg_2op = send_message
module.exports.send_msg_2op_disconnect = send_message_disconnect