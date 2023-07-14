'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs
const crypto = moduler.crypto
const hmt_id = require(`${REQUIRE_PATH.modules}/bwing/hmt_id`);


/**
 * Sign Up
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const postSignUp = async (req, res) => {

  const logiD = req.body.logiD
  console.log(`==============${logiD} KEEL　SIGNUP`)

  //Set client
  const client = req.client

  //Set datastore namespace
  const ns = req.ns

  //Get req data
  let id = req.body.id
  let pw = req.body.pw
  const expired = req.body.expired
  let user_data = {
    fname : req.body.fname,
    lname : req.body.lname,
    nname : req.body.nname,
    room_name : req.body.room_name,
  }
  user_data.signin_flg = req.body.signin_flg || false;

  //Create IDs Entity
  let ids = await createIDs(logiD, ns, id)
  console.log(`=========${logiD} Create IDs:${ids}`)
  if (ids.status_code != code.SUCCESS_ZERO) {
    express_res.funcErr(res, ids.status, ids.status_code);
    return 'Create IDs Error.';
  }

  //For anonymous user's id=UID, pw=random 16 strings
  if (!id && !pw) {
    id = ids.uid
    pw = crypto.seedRandom16()
    ids.keep_id = id
  }

  //Create Hash made from id & pw
  //Use hashMac create hash
  const hashIdPw = await crypto.hashMac(id, pw)
  if (!hashIdPw.issue) {
    express_res.funcErr(res, hashIdPw.status, hashIdPw.status_code);
    return 'Hash issue Error.';
  }
  console.log(`=========${logiD} KEEL sign up Hash:${hashIdPw.token}`)
  
  //Create random seed 8
  const seed = (expired)? crypto.seedRandom8() : ''
  console.log(`=========${logiD}:expired:${expired}/seed:${seed}`)

  //Encrypt from seed & hash.token.token 
  const encrypt = crypto.encrypt(`${seed}${hashIdPw.token}`)
  console.log(`=========${logiD} Keel sign up encrypt:${JSON.stringify(encrypt)}`)
  if (!encrypt.issue) {
    express_res.funcErr(res, encrypt.status, encrypt.status_code);
    return 'Encrypt error'
  }

  //Set keep id for UserUser insert
  user_data.id = ids.keep_id

  //Create Seed & Session Entity
  const session = await createSeedSession(logiD, ns, hashIdPw.token, seed, encrypt.crypt, ids.rid, ids.uid)
  console.log(`=========${logiD} Create seed & session:${JSON.stringify(session)}`)
  if (session.status_code == code.WAR_ALREADY_EXIST_103) {
    await ds_conf.room.deleteRoom(ns, ids.rid)  
    await ds_conf.common.deleteID(ns, ids.uid)
    return session
  } else if (session.status_code != code.SUCCESS_ZERO) {
    express_res.funcErr(res, session.status, session.status_code);
    return 'Create Session Error.';
  }

  //Create User Entity
  const user = await createUser(logiD, ns, ids.rid, ids.uid, user_data)
  if (user.status_code != code.SUCCESS_ZERO) {
    express_res.funcErr(res, user.status, user.status_code);
    return 'Create user Error.';
  }
  console.log(`=========${logiD} Create users:${JSON.stringify(user)}`)

  //Result
  const result =  {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "Sign up Success",
    token : session.token,
    hmt_id : session.hmt_id,
  }

  //Response
  express_res.func(res, result)

  return {
    result,
    oauth: {
      status_code : code.SUCCESS_ZERO,
      rid: user.rid,
      uid: user.uid,
      token: session.token,
      op_session: session.hmt_id,
    }
  };
};
module.exports.func = postSignUp;

/**
 * Create IDs
 * @param {*} logiD
 * @param {*} ns
 * @param {*} id
 */
const createIDs = async (logiD, ns, id) => {
  try {

    //Keep id in UserUser
    const keep_id = (id)? crypto.crypting(id, 'e') : null

    //Create Room
    const RID = await ds_conf.room.createRoom(ns);

    //UID発行
    const ID = await ds_conf.common.createID(ns);

    //Result
    const result = {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Create IDs Success",
      keep_id : keep_id,
      rid: RID.key.id,
      uid: ID.key.id,
    }
    console.log(`=========${logiD} createIDs():${JSON.stringify(result)}`)
    return(result)

  } catch(err) {
    console.log(err)
    const result =  {
      type : "SYSEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : "Create IDs failuer",
    }
    return(result)    
  }
}

/**
 * Create User
 * @param {*} rid 
 * @param {*} uid 
 */
const createUser = async (logiD, ns, rid, uid, user_data) => {
  try {

    //Create UserUID
    let testUUID = await ds_conf.user.createUserUID(ns, uid);

    //Create UserUser
    let testUser = await ds_conf.user.createUserUser(ns, uid, user_data)

    //Create UserRoom
    let testRoom = await ds_conf.user.createUserRoom(ns, rid, uid, user_data);

    //Create UserResContex
    let testResContext = await ds_conf.user.createUserResContext(ns, rid, uid, user_data)

    //Create UserStatus
    let testUserState = await ds_conf.user.putUserStatus(ns, rid, uid, {signin_flg: user_data?.signin_flg})

    //Result
    const result =  {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Create User Success",
      rid: rid,
      uid: uid,
    }
    console.log(`=========${logiD} createUser():${JSON.stringify(result)}`)
    return(result);

  } catch (err) {
    console.log(err)
    const result =  {
      type : "SYSEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : "Create User failuer",
    }
    return(result)
  }
}

/**
 * Create seed & session
 * @param {*} logiD 
 * @param {*} ns
 * @param {*} hashIdPw 
 * @param {*} seed 
 * @param {*} encrypt 
 * @param {*} rid 
 * @param {*} uid 
 */
const createSeedSession = async (logiD, ns, hashIdPw, seed, encrypt, rid, uid) => {

  try {

    //Create Seed
    const seeds = await ds_conf.session.createSeed(ns, hashIdPw, seed)
    if (seeds.status_code == 103) {
        //Result
        const result =  {
            type : "SYSTEM",
            status_code : 103,
            status_msg : seeds.status,
            status_msg : seeds.status,
            seed : seeds.seed,
        }
        return(result);
    }

    //Create Session
    const op_session = hmt_id.generate(uid, rid);
    const sessions = await ds_conf.session.createSession(ns, encrypt, rid, uid, { op_session: op_session });

    //Result
    const result =  {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Create Seed & Session Success",
      token : sessions.key.name,
      seed : seeds.key.name,
      hmt_id : op_session,
    }

    console.log(`=========${logiD} createSeedSession ENTITY:${JSON.stringify(result)}`)
    return(result);

  } catch(err) {
    console.log(err)
    const result =  {
      type : "SYSEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : "Create Seed & Session failuer",
    }
    return(result)
  }
}
