'use strict';

//OPerator config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;
const status = conf.status;

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs.session


const hmt_id = require('../../bwing/hmt_id');

const postLogin = require('./post_login');
const getMasterKeyword = require('./get_master_keyword');
const postTrackerEntry = require('./post_tracker_entry');

const OP_WHATYA_ID_KEY = 'hmt_id'
const OP_CLIENT_ID_KEY = 'customer_id'
/**
 * Login to OKSKY
 * @param {*} client
 */
/*
'data': {
    'referer: 'https://aiuer',
    'location': 'https://curreht.html',
    'user_agnet': 'Fuck Fuck',
    'time': (new Date()).getTime();
    'time_zone': 'Asia/Tokyo',
    'tags': {
        'id': 'aiueo',
        'email': 'aiueo@gmail.com'
    },  
},  
->
{
  client_code: "hmt-conne-8B3D32D9CF2DDB38",
  login: {
    keys: []
    values: []
  },
  query: null,
  info: {
    l: "https://dev2.hmt.svc-api.com/svc/oksky1.html"
    p: "MacIntel"
    r: "https://dev2.hmt.svc-api.com/svc/oksky2.html"
    t: 1600333484293
    tz: "Asia/Tokyo"
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36"
  }
}
*/
const initialize = async (client, token, data = {}) => {  
  //Get Master Keyword
  const masterKeyword = await getMasterKeyword.func(client).catch(err => {
    console.log("oksky initialize masterKyeword err", JSON.stringify(err));
    return null;
  });
  let keywords = [];
  if (masterKeyword) {
    for (let key of masterKeyword) {
      if (key.type === "master_keywords" && key.attributes?.key_name) {
        keywords.push(key.attributes.key_name)
      }
    }
  }
  // console.log('OKSKY MASTER KEYWORDS', keywords)
  if (!keywords || !keywords.length || keywords.indexOf(OP_WHATYA_ID_KEY) == -1) {
    //ID連携未対応（OKSKY側にhmt_idの設定なし）
    return {
      type: "MasterKeyword",
      status_code : code.ERR_S_OPERATOR_SYSTEM_907,
      status_msg : status.ERR_S_OPERATOR_SYSTEM_907,
      approval : false,
    }
  }

  //Get session
  const ns = `${conf.env.kvs.service}-${client}-${conf.env.environment}`
  const sessions = await ds_conf.getBySessionId(ns, token);
  // console.log('=================== SESSION ', JSON.stringify(sessions))
  if (!sessions || !sessions.length) {
    const result = {
      type: "OAuth",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : status.ERR_A_SYSTEM_990,
      approval : false,
    }
    return result
  }
  const currentSession = sessions[0]

  //parse OKSKY data
  let params = {}
  // const ua = parser(data.user_agnet)
  // console.log(ua)
  params.info = {
    l: data.location,
    p: data.platform, // || ua.cpu && ua.cpu.architecture ? ua.cpu.architecture : null,
    r: data.referer,
    t: Number(data.time),
    tz: data.time_zone,
    ua: data.user_agent,
  }

  params.query = {}
  for(let key of Object.keys(data.tags || {})){
    if(keywords.indexOf(key) != -1){
      params.query[key] = String(data.tags[key])
    }else if(key === 'id' && keywords.indexOf(OP_CLIENT_ID_KEY) != -1){
      // idの場合はキーをclient_idに変更して設定
      params.query[OP_CLIENT_ID_KEY] = String(data.tags[key])
    }
  }
  
  let opSession = currentSession.op_session || null
  if (!opSession) {
    opSession = hmt_id.generate(currentSession.uid, currentSession.rid);
  }
  opSession = String(opSession)
  params.login = {
    keys: [OP_WHATYA_ID_KEY],
    values: [opSession]
  }  
  params.query[OP_WHATYA_ID_KEY] = opSession

  // console.log('CALL OKSKY LOGIN API', client, params)
  const login = await postLogin.login(client, params)
  if(!login.approval) return login;
  const result = login.result

  let oldSession = {}
  let newSession = null
  if(result.access_token && result.access_token == currentSession.op_access_token){
    // OKSKYのtokenが変更されていない場合、OKSKY側のroomId等はそのまま設定
    // ※OKSKYのtokenが変更された場合、OKSKY側のroomId等は初期化
    oldSession = {...currentSession}
  }
  newSession = {
    ...oldSession,
    op_access_token : result.access_token,
    op_session : opSession,
  }
  await ds_conf.putSession({
    ns,
    session: currentSession,
    addProp: newSession
  })
  // console.log('======== PUT OP VALUES IN SESSION ', JSON.stringify(sess_result))  
  
  const res = await postTrackerEntry.func(client, result.access_token, params.info)
  // if(!login.approval) return result;

  return login;
};

module.exports.func = initialize;