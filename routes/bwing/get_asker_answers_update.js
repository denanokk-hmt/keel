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
const ds_conf = moduler.kvs.asker_hostnames
const {getRequest} = moduler.http


/**
 * Update Asker Answers
 * @param {*} req 
 * @param {*} res 
 */
const getAskerAnswersUpdate = async (req, res) => {

  const logiD = req.query.logiD
  console.log(`========= KEEL GET ASKER ANSWERS UPDATE ${logiD}===========`)

  //Set clinet
  const client = req.client

  //Set asker multi server svc
  //And old server code care:"svc" --> "svc"
  const svc = conf.svc_asker[client].replace(/stg$/, '')

  //datastore namespace
  const ns_hostnames = `${conf.env.kvs.service}-Asker-${svc}-${conf.env.environment}`
  console.log(`==${ns_hostnames}==`)

  //Get Asker server hostname
  let asker_updater = []
  let hostnames
  if (process.env.HOSTNAME || process.env.NODE_ENV) {
    //Case: Access on cloud server or CloudRun(no hostname, but has NODE_ENV)
    hostnames = await ds_conf.get(ns_hostnames, svc)
    .catch(err => {
      throw new Error(err.message)
    })
  } else {
    //Case: Access local server -->must set config params in asker_update.hostnames of env.json
    hostnames = conf.conf_keel.hostnames
  }

  //Set update asker answers instances 
  console.log(JSON.stringify(hostnames))
  for (let idx in hostnames) {
    console.log(hostnames[idx].hostname)
    asker_updater[idx] = {
      "valid_client" : svc,
      "update_client" : client,
      "name" : hostnames[idx].hostname,
      "commit_id" : hostnames[idx].commit_id,
      "update" : false,
    }
  }

  //Update asker server answers
  let result = []
  let cnt = 0
  let dead_line = 0
  for (let i=0; cnt < asker_updater.length;) {
    for (let idx in asker_updater) {

      if (asker_updater[idx].update == true) continue;

      //console.log("====GO ASKER")
      console.log(`====GO ASKER:${logiD} : ${JSON.stringify(asker_updater[idx])}`)
      result[idx] = await updateAskerAnswersEachPod(client, asker_updater[idx], logiD)
      .catch(err => {
        throw new Error(err.message)
      })
      console.log(`====BACK ASKER:${logiD}: ${JSON.stringify(result[idx])}`)
      if (result[idx].status_code == code.SUCCESS_ZERO) {
        asker_updater[idx].update = true
        asker_updater[idx].status = status.SUCCESS_ZERO
        asker_updater[idx].udt = result[idx].udt
        console.log(`====UPDATED ASKER:${logiD}: [INFO]|[ASKER]|${JSON.stringify(result[idx])}`)
        cnt ++
      } else {
        console.log(`====NO UPDATE ASKER:${logiD}: ${JSON.stringify(asker_updater[idx])}`)
      }
    }

    //update check
    let check = true
    for (let idx in asker_updater) {
      if (!result[idx].hostupdate) {
        check = false
        break;
      }
    }

    //Break condition
    if (check) {break};
    if (dead_line >= 20) {break};
    dead_line++
   }

   console.log(`========= KEEL AFTER ASKER UPDATE DS ${logiD}===========`)

  //Update asker hostnames update flg
  if (process.env.HOSTNAME && dead_line < 20) {
    for (let idx in asker_updater) {
      console.log(`Update update flg : ${asker_updater[idx].name} : ${asker_updater[idx].update}`)
      await ds_conf.put(ns_hostnames, svc, asker_updater[idx].name, asker_updater[idx].commit_id, true)
      .catch(err => {
        throw new Error(err.message)
      })
    }
  }

  //Response
  await Promise.all(result).then(results => { 
    //for (let idx in results) {
    //  console.log(results[idx])
    //}
    express_res.func(res, asker_updater)
  });
};
module.exports.func = getAskerAnswersUpdate;

/**
 * Updarte Asker Service Answers each Pod
 * @param {*} results
 * @param {*} host
 */
const updateAskerAnswersEachPod = async (client, host, logiD) => {
  const params = {
    "hook" : true,
    "client" : client,
    "version" : conf.version,
    "token" : conf.conf_keel.token,
    "hostname" : host.name,
    "hostupdate" : host.update,
    "logiD" : logiD,
  }
  //Keel to Asker get request
  console.log(`========= Keel to Asker get request:${JSON.stringify(params)}`)

  //Set asker server url: svc-hmt-asker.bwing.app/hmt/get/asker/answers/update
  //Asker is multi. No need client-code in the url pass. not like keel url pass.
  //Local debug url.  asker start on local use 8082 port.
  //const url = `http://localhost:8082/${conf.env.routes.url_api}/get/asker/answers/update`
  const url = `https://${conf.domains_asker[client]}/${conf.env.routes.url_api}/get/asker/answers/update`
  console.log(url)
    
  return await getRequest(url, params, response => {
    return response.data
  })
  .catch(err => {
    switch (err.status_code) {
      case 104:
        return err
      default :
        throw new Error(err.message)
    }
  })
}