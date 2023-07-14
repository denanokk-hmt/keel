'use strict'

const fs = require('fs');

//config
const conf = require(REQUIRE_PATH.configure);


let api = []
let path
const modules_dir = __dirname
for (let idx in conf.api_conn) {
  //console.log(conf.api_conn[idx].module)
  //console.log(conf.api_conn[idx].state)
  path = `${modules_dir}/${conf.api_conn[idx].module}/api.js`
  try {
    fs.statSync(path)
  } catch(err) {
    continue;
  }
  api[conf.api_conn[idx].state] = require(`${__dirname}/${conf.api_conn[idx].module}/api.js`) //api exec function
  api[conf.api_conn[idx].state]['module_name'] = conf.api_conn[idx].module // api module dir name
  api[conf.api_conn[idx].state]['pre'] = require(`${__dirname}/${conf.api_conn[idx].module}/api_routine_prepare.js`) //api prepare function

}
module.exports.module = api
