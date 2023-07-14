'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.session
const ds_conf_user = moduler.kvs.user
const crypto = moduler.crypto
const hmt_id = require(`${REQUIRE_PATH.modules}/bwing/hmt_id`);

//OAuth
const oAuth = moduler.oAuth


/**
 * Replace session, lost pw or session expired.
 * @param {*} req 
 * @param {*} res 
 */
const postSessionReplace = async (req, res) => {

  const logiD = req.logiD
  console.log(`=========${logiD} KEEL　SESSION REPLCAE===========`)

  //Get req data
  const client = req.client
  const id = req.body.id
  const pw = req.body.pw
  const expired = req.body.expired
  let old_token = req.body.token
  const reason = req.body.replace_reason
  const signin_flg = req.body.signin_flg || false;

  console.log(`=========${logiD} OLD TOKEN: ${old_token}`)

  //Decrypt old token
  const decrypt = await crypto.decrypt(old_token)
  console.log(`=========${logiD} OLD TOKEN DECRYPT:${JSON.stringify(decrypt)}`)
  if (!decrypt.issue) {
    express_res.funcErr(res, decrypt.status, decrypt.status_code)
    return 'Decrypt error'  
  }

  //Get Old Seed, Hash
  //Case of expired is true, token made from seed & hash encrypting
  //Case of expired is false, token made from only hash encrypting
  let old_seed, old_hash
  if (expired) {
    old_seed = decrypt.crypt.slice(0,8)
    old_hash = decrypt.crypt.slice(8,)
  } else {
    old_seed = decrypt.crypt.slice(0,8)
    old_hash = decrypt.crypt.slice(0,)
  }
  console.log(`=========${logiD}:Old Seed=${old_seed},Old Hash=${JSON.stringify(old_hash)}`)

  let hashIdPw
  if (!id && !pw) {
    //For Anonymous user. hash use token
    hashIdPw = old_hash
  } else {
    //For Session user. Create new hash made from id & pw
    const hash = await crypto.hashMac(id, pw)
    console.log(`=========${logiD} New Hash:${JSON.stringify(hash)}`)
    if (!hash.issue) {
      express_res.funcErr(res, hash.status, hash.status_code);
      return 'Token issue Error.';
    }
    hashIdPw = hash.token
  }

  //Create random seed 8
  const seed = (expired)? await crypto.seedRandom8() : ''
  console.log(`=========${logiD} New seed:${JSON.stringify(seed)}`)

  //Encrypt from seed & new_hash.token 
  const encrypt = await crypto.encrypt(`${seed}${hashIdPw}`)
  console.log(`=========${logiD} New encrypt:${JSON.stringify(encrypt)}`)
  if (!encrypt.issue) {
    express_res.funcErr(res, encrypt.status, encrypt.status_code);
    return 'Encrypt Error.';
  }

  console.log(`=========${logiD} SEED PUT ENTITY===========`)
  //Seed up date
  let result
  if (reason == 'pw_changed') {
    ////////////////////////
    //For Password changed token
    //(Never visit anonymous user)

    //Create SeedEntity
    result = await createSeed(logiD, client, hashIdPw, seed)
    if (result.status_code == code.ERR_A_SYSTEM_990) {
      express_res.funcErr(res, result.status, result.status_code);
      return 'Create Seed Error.';
    }
    console.log(`=========${logiD} Create seed entity:${JSON.stringify(result)}`)

    //Dflg Update Old Seed Entity
    result = await updateSeed(logiD, client, old_hash, seed, old_seed, 'old_seed_delete')
    if (result.status_code == code.ERR_A_SYSTEM_990) {
      express_res.funcErr(res, result.status, result.status_code);
      return 'Update Seed Error.';
    }
    console.log(`=========${logiD} Dflg Update to old seed entity:${JSON.stringify(result)}`)

  } else if (reason == 'token_expired') {
    ////////////////////////
    //For Expired token
   
    //Update Seed Entity
    result = await updateSeed(logiD, client, hashIdPw, seed, old_seed)
    console.log(`=========${logiD} Update seed:${JSON.stringify(result)}`)
    if (result.status_code != code.SUCCESS_ZERO) {
      express_res.funcErr(res, result.status, result.status_code);
      return 'Update Seed Error.';
    }
  }

  //OAuth & dflg update old Session
  const oauth = await oAuth.func({ns: req.ns, client, force_token: old_token,dflg: 'old_session_delete', logiD})
  console.log(`=========${logiD} OAUTH C RESULT:${JSON.stringify(oauth)}`)
  if (!oauth.approval) {
    express_res.funcErr(res, oauth.status, oauth.status_code);
    return 'Session replace Error.';
  }

  //Create Session. with before session having rid and uid
  const newData = {...oauth}
  const session = await createSession(logiD, client, encrypt.crypt, oauth.rid, oauth.uid, newData)
  console.log(`=========${logiD} Create session entity:${JSON.stringify(session)}`)
  if (session.status_code == code.ERR_A_SYSTEM_990) {
    express_res.funcErr(res, session.status, session.status_code);
    return 'Create Session Error.';
  }

  //Create UserStatus
  let testUserState = await ds_conf_user.putUserStatus(req.ns, oauth.rid, oauth.uid, {signin_flg: signin_flg})

  //Result
  result =  {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : `[${reason}]::Session replace Success.`,
    token : session.token,
    hmt_id : session.hmt_id,
  }

  //Response
  express_res.func(res, result)

  return { result, oauth: newData }
};
module.exports.func = postSessionReplace;

/**
 * Create seed
 * @param {*} logiD 
 * @param {*} client
 * @param {*} hashIdPw 
 * @param {*} seed
 */
const createSeed = async (logiD, client, hashIdPw, seed) => {
  try {

    //Set datastore namespace
    const ns = `${conf.env.kvs.service}-${client}-${conf.env.environment}`    

    //Create Seed
    const seeds = await ds_conf.createSeed(ns, hashIdPw, seed)
    //Result
    const result =  {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Create Seed Success",
      seed : seeds.key.name,
    }
    console.log(`=========${logiD} createSession ENTITY:${JSON.stringify(result)}`)
    return(result);

  } catch(err) {
    console.log(err)
    const result =  {
      type : "SYSEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : "Create Seed failuer",
    }
    return(result)
  }
}

/**
 * Create session
 * @param {*} logiD
 * @param {*} client
 * @param {*} encrypt 
 * @param {*} rid 
 * @param {*} uid 
 */
const createSession = async (logiD, client, encrypt, rid, uid, newData={}) => {
  try {

    //Set datastore namespace
    const ns = `${conf.env.kvs.service}-${client}-${conf.env.environment}`

    //Create Session
    if (!newData.op_session) {
      newData.op_session = hmt_id.generate(uid, rid);
    }
    const sessions = await ds_conf.createSession(ns, encrypt, rid, uid, newData)

    //Result
    const result =  {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Create Session Success",
      token : sessions.key.name,
      hmt_id : newData.op_session,
    }

    return(result);

  } catch(err) {
    console.log(err)
    const result =  {
      type : "SYSEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : "Create Session failuer",
    }
    return(result)
  }
}

/**
 * Update seed
 * @param {*} logiD 
 * @param {*} client 
 * @param {*} hashIdPw 
 * @param {*} seed 
 * @param {*} dflg
 */
const updateSeed = async (logiD, client, hashIdPw, seed, old_seed, dflg) => {
  try {

    //Set datastore namespace
    const ns = `${conf.env.kvs.service}-${client}-${conf.env.environment}`    

    //Update Seed
    const seeds = await ds_conf.updateSeed(ns, hashIdPw, seed, old_seed, dflg)
    console.log(`=========${logiD} SEEDS:${JSON.stringify(seeds)}`)
    if (seeds.status_code == 103) {
        //Result
        const result =  {
            type : "SYSTEM",
            status_code : code.WAR_ALREADY_EXIST_103,
            status_msg : seeds.status,
            seed : seeds.seed,
        }
        return(result);
    }

    //Result
    const result =  {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Update Seed Success",
      hash : seeds.key.name,
      seed : seeds.data.seed,
    }

    return(result);

  } catch(err) {
    console.log(err)
    const result =  {
      type : "SYSEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : "Update Seed failuer",
    }
    return(result)
  }
}