'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;
const status = conf.status;


/**
 * Put MarkRead to OKSKY
 * @param {*} client
 * @param {*} token
 */
const mark_read = async (client, token) => {
  return {
    result : result,
    status_code : code.SUCCESS_ZERO,
    status_msg : status.SUCCESS_ZERO,
    approval : true,
  }
};

module.exports.func = mark_read;