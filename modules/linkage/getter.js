'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const response = conf.linkage_data

/**
 * 
 * @param {*} key  text 'R101'
 * @param {*} data_name
 */
const getResponse = (key, data_name) => {
  const resource = response[data_name]
  return resource[key]
}
module.exports.getResponse = getResponse