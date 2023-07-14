'use strict';

//System modules
const { getRequest } = require(`${REQUIRE_PATH.moduler}/stand_alone`).wakeup('http')


/**
 * Set configure
 * @param args {*} {  
 * @param {*} appli_name 
 * @param {*} server_code 
 * @param {*} environment
 * } 
 */
const configuration = async (args) => {

  /////////////////////////
  //Set basic server configs

  //NODE ENV
  const hostname = process.env.HOSTNAME
  console.log(`hostname:${hostname}`)

  //Direcotry pass
  const dirpath =(process.env.NODE_ENV == 'prd')? '/home/dev' : '.'
  module.exports.dirpath = dirpath

  //express response common
  const express_res = require(`../routes/express_res`);
  module.exports.express_res = express_res

  //Application name
  const appli_name = args.appli_name
  module.exports.appli_name = appli_name

  //Server code
  const server_code = args.server_code
  module.exports.server_code = server_code

  //Depoy environmebt
  const environment = args.environment
  module.exports.environment = environment

  //short sha commit id
  const sha_commit_id = process.env.SHA_COMMIT_ID || null;

  //deploy stamp
  const deploy_unixtime = process.env.DEPLOY_UNIXTIME || 0;

  //restart stamp
  const restart_unixtime = process.env.RESTART_UNIXTIME || 0;

  //Set commitid
  //restart is grater than deploy_unixtime --> Restart, using latest revisions :: [sha_commit_id]_[restart_unixtime]
  //Other than that --> Deploy or Restart, using history revisions :: [sha_commit_id]
  const commitid =(deploy_unixtime < restart_unixtime)? `${sha_commit_id}_${restart_unixtime}` : sha_commit_id;

  /////////////////////////
  //Get configure by control tower

  //Set control tower credentials
  const run_domain = 'control-tower2.bwing.app';
  const run_version = '2.0.0';
  const run_token = require('./keel_auth.json').token;
  const domain = (process.env.NODE_ENV == 'prd')? `https://${run_domain}` : `http://localhost:8081`;
  const url = `${domain}/hmt/get/configuration`;
  const params = {
    appli_name : appli_name,
    version : run_version,
    token : run_token,
    server_code : server_code,
    environment : environment,
    hostname: process.env.HOSTNAME || 'localhost',
    commitid: commitid,
    component_version: process.env.VERSION || ((args.series=='v2')? '2.0.0' : '1.1.0'),
  }

  //Get configure
  const result = await getRequest(url, params, )
  .then(response => {
    if (response.data?.status_code != 0) {
      throw Error(`status_code:${response.data?.status_code}`)
    }
    return response.data
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })


  /////////////////////////
  //Exports configure
  
  //formation
  const formation = result.formation
  module.exports.formation = formation;

  //Project id
  const google_prj_id = result.google_prj_id
  module.exports.google_prj_id = google_prj_id
  
  //env
  const env = result.env;
  module.exports.env = env;

  //version
  const version = params.component_version;
  module.exports.version = version;

  //common(status_code, status_msg, dummy)
  const common = result.common
  const status_code = common.status_code;
  const status = common.status_msg;
  const dummy = common.dummy;
  module.exports.status_code = common.status_code;
  module.exports.status = common.status_msg;
  module.exports.dummy = common.dummy;

  //env_client
  const env_client = result.env_client;
  module.exports.env_client = env_client;

  //init interval
  const init_interval = await setInitInterval(env_client.invoke_init)
  module.exports.init_interval = init_interval;

  //init interval rbfaq
  const init_interval_rbfaq = await setInitInterval(env_client.invoke_init_rbfaq, 'rbfaq')
  module.exports.init_interval_rbfaq = init_interval_rbfaq;

  //api connect
  const api_conn = result.api_conn;
  module.exports.api_conn = api_conn;

  //default messagese
  const default_messages = result.default_messages;
  module.exports.default_messages = default_messages;

  //Asker Google spreadsheet
  const asker_sheet_config = result.asker_sheet_config;
  module.exports.asker_sheet_config = asker_sheet_config;

  //Asker config
  const conf_keel = result.keel_auth;
  module.exports.conf_keel = conf_keel;

  //Asker domains
  const domains_asker = []
  for (let idx in formation) {
    domains_asker[formation[idx].client] = formation[idx].asker.domain
  }
  module.exports.domains_asker = domains_asker

  //Asker server svc
  const svc_asker = []
  for (let idx in formation) {
    if (formation[idx].asker == '--') continue
    svc_asker[formation[idx].client] = formation[idx].asker.domain.split("-")[0]
  }
  module.exports.svc_asker = svc_asker

  //Tugcar domains
  const domains_tugcar = []
  // Wish domains
  const domains_wish = [];
  for (let idx in formation) {
    domains_tugcar[formation[idx].client] = formation[idx].tugcar?.domain
    domains_wish[formation[idx].client] = formation[idx].wish?.domain
  }
  module.exports.domains_tugcar = domains_tugcar
  // Wish domains
  module.exports.domains_wish = domains_wish

  //Set API routines
  const api_routines = []
  for (let idx in env_client.api_routine) {
    api_routines[idx] = env_client.api_routine[idx].routine
  }
  module.exports.api_routines = api_routines
    
  //Operator system
  let op_system = []
  const op_instance = require(`../modules/operator/op_instance`);
  for(let idx in env_client.operator) {
    for(let idx2 in op_instance) {
      if (idx2 == idx) {
        op_system[idx] = op_instance[idx2]    
      }
    }
  }
  module.exports.op_system = op_system

  // attachment config
  let attachment = env_client.attachment
  module.exports.attachment = attachment

  /////////////////////////
  //Local config files exports

  //AI default init config
  const config = require(`../modules/${api_conn['conversationAPI'].module}/init_config.json`);
  module.exports.config = config;

  //Instance API
  const api = require('../modules/api_routine_instance')
  module.exports.api = api

  //Set GooglespreadSheets api credentials path
  const google_sheets_credentials_path = `${dirpath}/config/${server_code}/google_sheets_api/credentials.json`;
  module.exports.google_sheets_credentials = google_sheets_credentials_path

  //Set GooglespreadSheets api token path
  const google_sheets_token_path = `${dirpath}/config/${server_code}/google_sheets_api/token.json`;
  module.exports.google_sheets_token = google_sheets_token_path


  /////////////////////////
  //Return to app
  return {
    server_code,
    formation,
    env,    
    status_code,
    status,
  }
} 

module.exports = { configuration }


/**
 * Set init interval
 * @param args
 */
async function setInitInterval(invoke_init, type='watson') {

  //Set Invoke init interval
  let init_interval = []
  let init_interval_str = []
  for (let idx1 in invoke_init) {
    init_interval[idx1] = 0
    init_interval_str[idx1] = ''
    for (let idx in invoke_init[idx1].interval) {
      if (invoke_init[idx1].interval[idx]) {
        switch (idx) {
          case "0" :
            init_interval[idx1] += invoke_init[idx1].interval[idx]*1000
            init_interval_str[idx1] += `: ${invoke_init[idx1].interval[idx]} sec`
            break;
          case "1" :
            init_interval[idx1] += invoke_init[idx1].interval[idx]*1000*60
            init_interval_str[idx1] += `: ${invoke_init[idx1].interval[idx]} min`
            break;
          case "2" :
            init_interval[idx1] += invoke_init[idx1].interval[idx]*1000*60*60
            init_interval_str[idx1] += `: ${invoke_init[idx1].interval[idx]} hour`
            break;
          case "3" :
            init_interval[idx1] += invoke_init[idx1].interval[idx]*1000*60*60*24
            init_interval_str[idx1] += `: ${invoke_init[idx1].interval[idx]} Day`
            break;
        }
      }
    }
  }
  
  for (let idx in init_interval_str) {
    console.log(`Invoke init interval (${type}):${idx}:${init_interval_str[idx]}`)
  }

  return init_interval
}