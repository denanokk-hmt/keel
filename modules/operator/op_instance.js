'use strict'

const fs = require('fs');

//config
const conf = require(REQUIRE_PATH.configure);

let op_instance = []
let path
const modules_dir = __dirname
for (let idx in conf.env_client.operator) {
  path = `${modules_dir}/${conf.env_client.operator[idx].system_name}`
  try {
    fs.statSync(path)
  } catch(err) {
    continue;
  }

  //Set system & system credentials
  op_instance[idx] = { "system" : conf.env_client.operator[idx].system_name }
  op_instance[idx] = { "credentials" : conf.env_client.operator[idx].system_config.credentials }

  const files = fs.readdirSync(path);

  //instance op_system files
  for (let idx2 in files) {
    let name = files[idx2].replace(/.js$/,"")
    op_instance[idx][name] = require(`${path}/${files[idx2]}`)
  }
}
module.exports = op_instance