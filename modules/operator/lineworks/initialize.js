'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;
const status = conf.status;


/**
 * Login to OKSKY
 * @param {*} client
 */
const initialize = async (client, token, data = {}) => {
  return {
    result : result,
    status_code : code.SUCCESS_ZERO,
    status_msg : status.SUCCESS_ZERO,
    approval : true,
  }
};

module.exports.func = initialize;