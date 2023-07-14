'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//express
var express = require('express')
var router = express.Router()
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const valid = moduler.validation
const crypto = moduler.crypto
const ds_conf = moduler.kvs
const fr = moduler.recorder.FlightRecorder  //flight-recorder
const adf = require(`${REQUIRE_PATH.modules}/api_default_func`).apiDefaultFunc

const hooks = require(`${REQUIRE_PATH.modules}/messages/talk/hooks`)

//[routes modules]
const postSignUp = require(`./bwing/post_signup`)
const postSessionReplace = require(`./bwing/post_session_replace`)
const postSessionUpdateWhatyaId = require(`./bwing/post_session_update_hmt_id`)
const postUserStatusUpdate = require(`./bwing/post_user_status_update`)
const getMessages = require(`./bwing/get_messages`)
const postMessage = require(`./bwing/post_message`)
const postOpSendMessage = require(`./bwing/post_op_send_message`)
const postOpSendHistories = require(`./bwing/post_op_send_histories`)
const postOpReceiveMessage = require('./bwing/post_op_receive_message')
const postOpUser = require('./bwing/post_op_user')
const getOpLineWorksImg = require('./bwing/get_op_lineworks_img')
const postOpRegLineworksBot = require('./bwing/post_op_reg_lineworks_bot')
const putOpSignIn = require('./bwing/put_op_signin')
const putOpMarkRead = require('./bwing/put_op_mark_read')
const getOpUnread = require('./bwing/get_op_unread')
const postAttachmentSearch = require('./bwing/post_attachment_search')
const postAttachmentDetails = require('./bwing/post_attachment_details')
const postSpltagSearch = require('./bwing/post_spltag_search')

//Tester
const ciTester = require(`./bwing/ci_tester`)
const getQuest = require(`./bwing/get_quest`)
const getQa = require(`./bwing/get_qa`)

//Askers
const getAskerAnswersUpdate = require(`./bwing/get_asker_answers_update`)
const postAskerAnswersUpdate = require('./bwing/post_asker_answers_update')
const getAskerResponseUpdate = require(`./bwing/get_asker_response_update`)
const postAskerResponseUpdate = require(`./bwing/post_asker_response_update`)

//PubSub
const postPubsubPublish = require(`./bwing/post_pubsub_publish`)
const postPubsubSubscribe = require(`./bwing/post_pubsub_subscribe`)

//For OKSKY
const postOkskyLogin = require('./bwing/post_op_login')     //for test
const postOkskyMessage = require('./bwing/post_op_message') //for test

//Marshaller
const postMarshallerRegisterCoupon = require('./bwing/post_marshaller_register_coupon')
const getMarshallerCleanupCoupon = require('./bwing/get_marshaller_cleanup_coupon');
const getMarshallerRulebase = require('./bwing/get_marshaller_rulebase')
const getMarshallerRulebaseScenario = require('./bwing/get_marshaller_rulebase_scenario')
const postMarshallerRulebase = require('./bwing/post_marshaller_rulebase')
const postMarshallerSysmsg = require('./bwing/post_marshaller_sysmsg')
const getMarshallerSysmsg = require('./bwing/get_marshaller_sysmsg')
const getMarshallerMessageContainer = require('./bwing/get_marshaller_message_container')
const getMarshallerMessageContainerParents = require('./bwing/get_marshaller_message_container_parents')
const postMarshallerMessageContainer = require('./bwing/post_marshaller_message_container')
const getMarshallerDialog = require('./bwing/get_marshaller_dialog')
const getMarshallerDialogMessage = require('./bwing/get_marshaller_dialog_message')
const getMarshallerDialogDeleted = require('./bwing/get_marshaller_dialog_deleted')
const getMarshallerDialogHeads = require('./bwing/get_marshaller_dialog_heads')
const postMarshallerDialog = require('./bwing/post_marshaller_dialog')
const deleteMarshallerDialog = require('./bwing/delete_marshaller_dialog')
const postMarshallerDialogRelease = require('./bwing/post_marshaller_dialog_release')

// Wish
const getWishes = require('./bwing/get_wishes')
const postWishCreate = require('./bwing/post_wish_create')
const postWishDelete = require('./bwing/post_wish_delete')
const postWishGetDetails = require('./bwing/post_wish_get_details')


/**
 * ///////////////////////////////////////////////////
 * Error Response
 * @param {*} err 
 * @param {*} next 
 */
function errHandle2Top(err, next) {
  const result = {
    type: "API",
    status_code: code.ERR_S_API_REQ_902,
    status_msg : status.ERR_S_API_REQ_902,
    approval: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
  }
  next(result)
}

/**
 * ///////////////////////////////////////////////////
 * Basic validation
 * @param {*} res
 * @param {*} params
 */
function basicValidation(res, params) {

  //Validation IsValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Validation Version auth
  valid_result = valid.versionAuth(params.version)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Version valid error.'
  }
}

function fetchObjectByKeys(obj, keys) {
  const objKeys = Object.keys(obj || {});
  let params = {};
  for (let key of keys) {
    if (objKeys.indexOf(key) != -1) {
      params[key] = obj[key];
    }
  }
  return params;
}

/**
 * ///////////////////////////////////////////////////
 * [[[For Developement]]]
 * Get Node process env
 */
router.get('/get/env', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  let result = process.env
  result.node_version = process.version
  express_res.func(res, result)
})

/**
 * ///////////////////////////////////////////////////
 * Get config
 */
router.get('/get/config', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  let params = {
    version: req.query.version,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Token validation
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }
  
  //Response configures
  express_res.func(res, conf)

  return true
})

/**
 * ///////////////////////////////////////////////////
 * [[[For Developement]]]
 * Issue Token
 */
router.get('/get/token', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  const params = {
    version: req.query.version,
    token: req.query.token,
    id: req.query.id,
    pw: req.query.pw,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Keel Auth
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Hash token made from id & pw
  const hashIdPw = await crypto.hashMac(params.id, params.pw)
  if (!hashIdPw.issue) {
    express_res.funcErr(res, hashIdPw.status, hashIdPw.status_code);
    return 'Token issue Error.';
  }

  //Create random seed 8
  const seed = (req.query.seed) ? req.query.seed : crypto.seedRandom8()

  //Encrypt from seed & hashIdPw.token 
  console.log(`${seed}${hashIdPw.token}`)
  const encrypt = crypto.encrypt(`${seed}${hashIdPw.token}`)
  if (!encrypt.issue) {
    express_res.funcErr(res, encrypt.status, encrypt.status_code);
    return 'Encrypt error'  
  }

  //Response
  express_res.func(res, encrypt)
})

/**
 * ///////////////////////////////////////////////////
 * Customer sign up
 */
router.post('/post/signup', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  let params = {
    version: req.body.version,
    domain: req.body.domain,
  }

  //Basic validation
  let result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Sign Up
  result = await postSignUp.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'sign up error'
  });
 
  //flight-recorder
  res.oauth = result.oauth
  next()
}, fr.Final)

/**
 * ///////////////////////////////////////////////////
 * Session replace for password updated
 */
router.post('/post/session/replace/token', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  let params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    reason: req.body.replace_reason,
  }

  //Basic validation
  let result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD  

  //Anonymous user care (Null)
  params.id = req.body.id
  params.pw = req.body.pw

  //Sign Up
  result = await postSessionReplace.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post session replace token error'
  });
 
  //flight-recorder
  res.oauth = result.oauth
  next()
}, fr.Final)

/**
 * ///////////////////////////////////////////////////
 * Session replace for password updated
 */
router.post('/post/session/replace/pw', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  const params = {
    version: req.body.version,
    domain: req.body.domain,
    id: req.body.id,
    pw: req.body.pw,
    token: req.body.token, //this is old token
    reason: req.body.replace_reason,
  }

  //Basic validation
  let result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD  

  //Sign Up
  result = await postSessionReplace.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post session replace pw error'
  });
 
  //flight-recorder
  res.oauth = result.oauth
  next()
}, fr.Final)

/**
 * ///////////////////////////////////////////////////
 * Session.hmt_id update
 */
router.post('/post/session/update/hmtid', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  let params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Update hmt_id
  postSessionUpdateWhatyaId.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post session update hmt id error'
  });
 
})

/**
 * ///////////////////////////////////////////////////
 * UserStatus.signin_flg update
 */
 router.post('/post/user_status/update/signin_flg', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  let params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
  };

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result;
  }

  //Set logiD
  params.logiD = req.logiD;
  //Set state
  params.status = {
    signin_flg: req.body.signin_flg
  };

  //Update hmt_id
  postUserStatusUpdate.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next);
    return 'post user_status update signin_flg error';
  });
})

/**
 * ///////////////////////////////////////////////////
 * Get messages
 */
router.get('/get/messages', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.query.version,
    domain: req.query.domain,
    //token : req.query.token,
    rid: req.query.rid,
    mtime: req.query.mtime,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Get Messages
  getMessages.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get messages error'
  });
})

/**
 * ///////////////////////////////////////////////////
 * Customer post Message from Boradig
 */
router.post('/post/message', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    rid: req.body.rid,
    uid: req.body.uid,
    talk_type: req.body.talk_type,
    talk_quest: req.body.talk_content_message,
    send_to : (req.body.send_to) ? req.body.send_to : 'bot',
  }

  //Image message
  if (params.talk_type === "image") {
    params = {
      ...params,
      talk_img_url: req.body.img_url,
      talk_img_alt: req.body.alt,
    }
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Get value( or null)
  params.talk_value = req.body.talk_content_value
  params.talk_dialog_values = req.body.talk_content_dialog_values

  //Set rid & uid
  let auth = {}
  auth.rid = params.rid
  auth.uid = params.uid
  auth.hmt_id = req.body.hmt_id || null

  params.testing = req.body.testing || false;

  // wy params
  params = {
    ...params,
    ...fetchObjectByKeys(req.body, ["current_url", "wy_event", "wy_login", "wy_data"])
  };
  
  //Post message
  if (params.send_to === 'bot') {
    //Post message
    await postMessage.func(auth, req, res, params)
    .catch(err => {
      errHandle2Top(err, next)
      return 'post message to bot error'
    });

  } else {

    //Set op access token parameter
    params.op_access_token = req.body.op_access_token

    //Respond Operator
    await postOpSendMessage.func(auth, req, res, params)
    .catch(err => {
      errHandle2Top(err, next)
      return 'post message to op error'
    });
  }

  next();
}, fr.Final)

/**
 * ///////////////////////////////////////////////////
 * Invoke
 */
router.post('/post/invoke', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params = {
    version: req.body.version,
    domain: req.body.domain,
    //token : req.body.token,
    rid : req.body.rid,
    uid : req.body.uid,
    talk_type : req.body.type,
    send_to :  req.body.send_to,
    content : (conf.env.local_dummy_mode)? req.body.content : JSON.parse(req.body.content),
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Set invoke status
  params.invoke = (req.body.worth_words)? false : true //worth wordsの場合、invokeステータスを下げる
  
  //Set rid & uid
  let auth = {}
  auth.rid = params.rid
  auth.uid = params.uid
  auth.hmt_id = req.body.hmt_id || null

  //Set clinet
  const client = req.client

  //Set datastore namespace
  const ns = req.ns

  //Set now
  const dt = (new Date).getTime()

  //Invoke clear_response
  if (params.talk_type == 'clear_response') {
    console.log(`=========${req.logiD} Response context clear===========`)

    if (!conf.env.local_dummy_mode) {
      await ds_conf.user.putUserResContext(
        ns,
        String(auth.rid),
        String(auth.uid),
        JSON.stringify({ response_context: '', }),
        dt,
        conf.init_interval[client] + dt
      )
    }
    console.log(`=========${req.logiD} Conversation reset===========`)
    const resMessages = {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : "Conversation reset.",
    }
    //Response
    express_res.func(res, resMessages)
    return "Conversation reset."
  }

  //Invoke init interval check for bot
  if (params.talk_type == 'init' && params.send_to == 'bot' && !req.body.wy_event) {
    // if message has wy_event, disable init_interval and reconnect_operator.
    // Check on connecting operator
    const op_config = (conf.env_client.operator[client]) ? conf.env_client.operator[client].system_config : null
    const expiration_time = (op_config && op_config.reconnect) ? (op_config.reconnect.expiration_time || 0) : 0
    if(expiration_time && params.content.message == 'init_bot'){
      let opMessages  = await ds_conf.message.getMessages(ns, params.rid, dt, 'lt', '1', 'operator')
      let botMessages = await ds_conf.message.getMessages(ns, params.rid, dt, 'lt', '1', 'bot')
      let opLastMtime  = opMessages.length ? opMessages[0].mtime : 0
      let botLastMtime = botMessages.length ? botMessages[0].mtime : 0
      console.log('op message:', opLastMtime, ', bot message:', botLastMtime)
      if(opLastMtime > botLastMtime) {
        // OPのメッセージがBOTのメッセージより新しい場合
        if ((opLastMtime + expiration_time) > dt) {
          // 最後のOPメッセージから有効期限内の場合
          console.log(`=========${req.logiD} RECONNECT OPERATOR`)
          const resMessages = {
            type : "API",
            status_code : code.SUCCESS_ZERO,
            status_msg : "Reconnect operator.",
            qty: 1,
            messages: [
              {
                cdt: new Date(),
                mtime: dt,
                mtype: "bot",
                talk: {
                  type: "command",
                  content: {
                    message: "connect_operator"
                  }
                }
              }
            ],
          }
          //Response
          express_res.func(res, resMessages)
          return "Reconnect operator"    
        }
      }
    }

    console.log(`=========${req.logiD} Set & Check Bot Init Interval===========`)
    let init_interval = dt

    // get hooks(rbfaq, mc) init interval. if not hooks message, return null and dont anything.
    const hooks_interval = await hooks.init_interval({
      ns,
      uid: String(auth.uid),
      message: params.content.message,
      logiD: req.logiD
    });
    if (hooks_interval) {
      init_interval = hooks_interval.value || dt;
    } else {
      //Get init interval from response_context
      let entity = await ds_conf.user.getUserResContext(ns, String(auth.uid))
      console.log(`=========${req.logiD} ResContest`,JSON.stringify(entity))

      //Get init interval
      init_interval = (entity.length) ? Number(entity[0].init_interval) : dt
    }
    console.log(`=========${req.logiD}:INIT INTERVAL`, `${init_interval}/DT:${dt}`)

    //Less than interval Invoke init msg
    if (init_interval > dt) {
      console.log(`=========${req.logiD} LESS INTERVAL`, `${init_interval}/DT:${dt}`)
      const resMessages = {
        type : "API",
        status_code : code.SUCCESS_ZERO,
        status_msg : "Less than Invoke init interval.",
        qty: 0,
        messages: [],
      }
      //Response
      express_res.func(res, resMessages)
      return "Less interval"
    }
  }

  //Set init message
  console.log(`=========${req.logiD} SET Invoke init message===========`)
  switch (params.talk_type) {
    case 'init':
    case 'clear_response': 
      params.talk_quest = params.content.message;
      break;
    case 'set_values':
      params.talk_quest = params.content.message;
      params.set_values = params.content;
  }
  /////////////////////

  params.testing = req.body.testing || false;

  // wy params
  params = {
    ...params,
    ...fetchObjectByKeys(req.body, ["current_url", "wy_event", "wy_login"])
  };

  console.log(`=========${req.logiD} GOTO POST MSG===========`)
  //Post invoke message
  await postMessage.func(auth, req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'invoke error'
  });

  next();
}, fr.Final)

////////////////////////////////////////////////////////////
// Put Signin to Operator system
////////////////////////////////////////////////////////////
router.put('/put/op/signin', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.body.version,
    token: req.body.token,
  }

  //Basic validation
  let result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD
  
  //Set op data
  params.data = req.body.data

  //Update response answers
  result =  await putOpSignIn.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'put op signin Error'
  });

  //flight recorder
  res.oauth = result.oauth
  next();
}, fr.Final)

////////////////////////////////////////////////////////////
// Put Mark Read to Operator system
////////////////////////////////////////////////////////////
router.put('/put/op/mark_read', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.body.version,
    token: req.body.token,
  }

  //Basic validation
  let result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD
  
  params.mtime = req.body.mtime

  //Put mark_read
  result =  await putOpMarkRead.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'put op mark_read Error'
  });
})

////////////////////////////////////////////////////////////
// Get unread operator message count
////////////////////////////////////////////////////////////
router.get('/get/op/unread', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.query.version,
    token: req.query.token,
  }

  //Basic validation
  let result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD
  
  params.qty = (req.query.qty)? req.query.qty : 10;

  //Put mark_read
  result =  await getOpUnread.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get op unread Error'
  });
})

////////////////////////////////////////////////////////////
// Post histories to Operator system
////////////////////////////////////////////////////////////
router.post('/post/op/send/histories', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.body.version,
    token: req.body.token,
    rid : req.body.rid,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Update response answers
  postOpSendHistories.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post op send histories Error'
  });
})

////////////////////////////////////////////////////////////
//CI Tester
//Request from boardinfg
//Basic validation had done in boarding
////////////////////////////////////////////////////////////
router.get('/quest/ci/tester', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  ciTester.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get quest CI tester error'
  });
});

////////////////////////////////////////////////////////////
// Anonymous
// これまでは(b-wnc) domian/hmt/svc/quest?version=1.0.5&domain=svc.co.jp&text=HHHHH
// これからは(keel) domian/hmt/svc/get/quest?version=1.0.5&domain=svc.co.jp&text=HHHHH
////////////////////////////////////////////////////////////
router.get('/get/quest', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
    talk_type: req.query.talk_type,
    talk_quest: req.query.talk_content_message,
    send_to : req.query.send_to,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD
  
  await getQuest.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get quest error'
  });

  next();
}, fr.Final)

////////////////////////////////////////////////////////////
// TESTER
////////////////////////////////////////////////////////////

router.get('/get/qa', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Validation
  const valid_result = valid.versionAuth(req.query.version)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Set logiD
  params.logiD = req.logiD

  getQa.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'qa error'
  });
})

////////////////////////////////////////////////////////////
// [OLD][NO USE] Asker answers update
////////////////////////////////////////////////////////////
router.get('/get/asker/answers/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.query.version,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Update instance answers
  getAskerAnswersUpdate.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'asker answer update error'
  });
})

////////////////////////////////////////////////////////////
// [OLD][NO USE] Asker Response update
////////////////////////////////////////////////////////////
router.get('/get/asker/response/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version : req.query.version,
    token : req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Update response answers
  getAskerResponseUpdate.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'asker response update error'
  });
})

////////////////////////////////////////////////////////////
// Asker answers update
////////////////////////////////////////////////////////////
router.post('/post/asker/answers/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    client : req.client,
    version: req.body.version,
    token: req.body.token,
    credentials: req.body.credentials,
    config: req.body.config,
    default_messages: req.body.default_messages,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Update instance answers
  postAskerAnswersUpdate.func(res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'asker answer update error'
  });
})

////////////////////////////////////////////////////////////
// Asker Response update
////////////////////////////////////////////////////////////
router.post('/post/asker/response/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.body.version,
    token: req.body.token,
    header_line: req.body.header_line,
    response: req.body.response
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  //Update response answers
  postAskerResponseUpdate.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'asker answer response error'
  });
})

////////////////////////////////////////////////////////////
// PubSub Publish
////////////////////////////////////////////////////////////
router.post('/post/pubsub/publish', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.body.version,
    token: req.body.token,
    topic: req.body.topic,
    data: JSON.stringify(req.body.data),
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  postPubsubPublish.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Publish error'
  });
})

////////////////////////////////////////////////////////////
// PubSub Subscribe (push)
////////////////////////////////////////////////////////////
router.post('/post/pubsub/subscribe', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: conf.version,
    data: req.body.message.data,
    message_id: req.body.message.message_id,
    subscription: req.body.subscription,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  postPubsubSubscribe.push(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Subscribe error'
  });
})

////////////////////////////////////////////////////////////
// Post oksky login
////////////////////////////////////////////////////////////
router.post('/post/oksky/login', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  const params = {
    version: req.body.version,
    domain: req.body.domain,
    send_to: req.body.send_to,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD

  postOkskyLogin.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'oksky login error'
  });
})

////////////////////////////////////////////////////////////
// Post message to oksky
////////////////////////////////////////////////////////////
router.post('/post/oksky/message', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  if (!conf.env.local_dummy_mode) {
    //Borading経由のリクエスト
    params = {
      version: req.body.version,
      domain: req.body.domain,
      rid: req.body.rid,
      uid: req.body.uid,
      talk_type: req.body.talk_type,
    }
    if (params.talk_type === "text") {
      params = {
        ...params,
        talk_quest: req.body.talk_content_message
      }
    }
    if (params.talk_type === "image") {
      params = {
        ...params,
        talk_img_url: req.body.talk_img_url,
        talk_img_alt: req.body.talk_img_alt,
      }
    }

  } else {
    //localでkeelにダイレクトでCurlを叩きたい
    //-->Borading経由とReqのJSON配列が異なる
    params = {
      version: req.body.version,
      domain: req.body.domain,
      rid: req.body.rid,
      uid: req.body.uid,
      talk_type: req.body.talk.type,
      talk_quest: req.body.talk.content.message,
    }
  }

  // Basic validation
  // const result = basicValidation(res, params);
  // if (result) {
  //   return result
  // }

  //Get value( or null)
  if (!conf.env.local_dummy_mode) {
    params.talk_value = req.body.talk_content_value
    params.talk_dialog_values = req.body.talk_content_dialog_values
  } else {
    params.talk_value = req.body.talk.content.value
    params.talk_dialog_values = req.body.talk.content.dialog_values
  }

  //Set logiD
  params.logiD = req.logiD

  //Post message
  postOkskyMessage.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post oksky message error'
  });
})

////////////////////////////////////////////////////////////
// Receive message from operator system
////////////////////////////////////////////////////////////
router.post('/post/op/receive/message', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  let params = {
    action : req.body.action,
    token : req.body.token,
    op_rid : req.body.op_rid,
    op_name: req.body.op_name,
    op_ope_uid : req.body.op_ope_uid,
    talk_type : req.body.talk_type,
    content : req.body.content,
    rid : req.body.rid,
  }

  //Validation isValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Set logiD
  params.logiD = req.logiD

  //Update response answers
  const result = await postOpReceiveMessage.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post op receive message error'
  });

  //flight recorder
  res.oauth = result.oauth
  next();
}, fr.Final)


////////////////////////////////////////////////////////////
// Wehook from operator system
////////////////////////////////////////////////////////////
router.post('/post/op/user', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  let params = {
    token : req.body.token,
    system : req.body.system,
    op_ope_uid : req.body.op_ope_uid,
    name : req.body.name,
  }

  //Validation isValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Set logiD
  params.logiD = req.logiD

  //Set user data
  params.full_name  = req.body.full_name || null
  params.avatar_url = req.body.avatar_url || null

  //Update response answers
  postOpUser.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post op user error'
  });
})

module.exports = router;        
// Get image from Works Mobile (LINE WORKS)
////////////////////////////////////////////////////////////
router.get('/get/op/lineworks/img', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  
  //Set logiD
  params.logiD = req.logiD  
  
  getOpLineWorksImg.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get LINE WORKS image error.'
  })
})

////////////////////////////////////////////////////////////
// Register new talk bot for LINE WORKS.
////////////////////////////////////////////////////////////
router.post('/post/op/reg/lineworks/bot', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Set logiD
  params.logiD = req.logiD

  //Do it.
  postOpRegLineworksBot.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post op reg lineworks bot Error'
  })
})

/**
 * ///////////////////////////////////////////////////
 * post Attachment Search from Borading
 */
 router.post('/post/attachment/search', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    query: req.body.query,
    chained_tags: req.body.chained_tags,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  params.current_url = req.body.current_url
  params.current_params = req.body.current_params
  params.customer_uuid   = req.body.customer_uuid
  params.hmt_id      = req.body.hmt_id

  //Set logiD
  params.logiD = req.logiD
  
  //Post attachment search
  await postAttachmentSearch.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post attachment search error'
  });

  next();
}, adf.Final)

/**
 * ///////////////////////////////////////////////////
 * post Attachment Details from Borading
 */
 router.post('/post/attachment/details', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    current_url: req.body.current_url,
    query: req.body.query,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  params.current_url = req.body.current_url
  params.current_params = req.body.current_params
  params.customer_uuid   = req.body.customer_uuid
  params.hmt_id      = req.body.hmt_id
  params.chained_tags   = req.body.chained_tags

  //Set logiD
  params.logiD = req.logiD
  
  //Post attachment search
  await postAttachmentDetails.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post attachment details error'
  });

  next();
}, adf.Final)

/**
 * ///////////////////////////////////////////////////
 * post Specialtag Search from Borading
 */
 router.post('/post/spltag/search', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    query: req.body.query,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  params.current_url = req.body.current_url
  params.current_params = req.body.current_params
  params.customer_uuid  = req.body.customer_uuid
  params.hmt_id      = req.body.hmt_id
  params.chained_tags   = req.body.chained_tags;

  //Set logiD
  params.logiD = req.logiD
  
  //Post attachment search
  await postSpltagSearch.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post spltag search error'
  });

  next();
}, adf.Final)

////////////////////////////////////////////////////////////
// Register new coupons with JSON.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/register/coupon', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    content: req.body.content,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  //Set logiD
  params.logiD = req.logiD

  postMarshallerRegisterCoupon.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller register coupon error.'
  })
  
})

////////////////////////////////////////////////////////////
// Register new coupon with params.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/generate/coupon', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
  }

  // fragments of coupon.
  let code = req.body.content.code
  let qty = req.body.content.quantity
  let name = req.body.content.name
  let expire = req.body.content.expire
  let img_url = req.body.content.img_url

  let cobj = {
    name,
    expire,
    img_url,
    codes: []
  }
  for (let i=0; i < qty; i++) { cobj.codes.push({code}) }
  params.content = [cobj]

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  //Set logiD
  params.logiD = req.logiD

  // Shared library
  postMarshallerRegisterCoupon.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller register coupon error.'
  })
  
})


////////////////////////////////////////////////////////////
// Flagging coupons with batch.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/cleanup/coupon', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  //Set logiD
  params.logiD = req.logiD

  getMarshallerCleanupCoupon.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller cleanup coupon error.'
  })
  
})
////////////////////////////////////////////////////////////
// Get all responsies of rulebase.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/rulebase', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerRulebase.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller rulebase error.'
  })
  
})

////////////////////////////////////////////////////////////
// Get all responsies of rulebase.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/rulebase/scenario', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerRulebaseScenario.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller rulebase error.'
  })
  
})

////////////////////////////////////////////////////////////
// Post responsies of rulebase.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/rulebase', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    content: req.body.content
  }
  
  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  postMarshallerRulebase.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller rulebase error.'
  })
    
  })

////////////////////////////////////////////////////////////
// Register System messages.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/sysmsg', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    committer: req.body.committer,
    content: req.body.content
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  //Set logiD
  params.logiD = req.logiD

  postMarshallerSysmsg.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller sysmsg error.'
  })
  
})

////////////////////////////////////////////////////////////
// Get System messages.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/sysmsg', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  //Set logiD
  params.logiD = req.logiD

  getMarshallerSysmsg.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller sysmsg error.'
  })
  
})

////////////////////////////////////////////////////////////
// Get all responsies of message container.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/mc', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerMessageContainer.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller mc error.'
  })
})

////////////////////////////////////////////////////////////
// Get all responsies of message container.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/mc/parents', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerMessageContainerParents.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller mc parents error.'
  })
})

////////////////////////////////////////////////////////////
// Post responsies of message container.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/mc', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    content: req.body.content
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }
  
  params.committer = req.body.committer;

  postMarshallerMessageContainer.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller mc error.'
  })
})

////////////////////////////////////////////////////////////
// Get all responsies of dialog.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/dialog', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerDialog.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller dialog error.'
  })
})

////////////////////////////////////////////////////////////
// Get specific response of dialog.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/dialog/message', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
    response_id: req.query.response_id,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerDialogMessage.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller dialog message error.'
  })
})

////////////////////////////////////////////////////////////
// Get deleted dialog.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/dialog/deleted', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerDialogDeleted.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller deleted dialog error.'
  })
})

////////////////////////////////////////////////////////////
// Get all responsies of dialog.
////////////////////////////////////////////////////////////
router.get('/get/marshaller/dialog/heads', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  getMarshallerDialogHeads.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get marshaller dialog heads error.'
  })
})

////////////////////////////////////////////////////////////
// Post responsies of dialog.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/dialog', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    content: req.body.content
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  postMarshallerDialog.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller dialog error.'
  })
})

////////////////////////////////////////////////////////////
// Delete responsies of dialog.
////////////////////////////////////////////////////////////
router.delete('/delete/marshaller/dialog', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    content: req.body.content
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  deleteMarshallerDialog.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'delete marshaller dialog error.'
  })
})

////////////////////////////////////////////////////////////
// Post dialog release.
////////////////////////////////////////////////////////////
router.post('/post/marshaller/dialog/release', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params
  params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) { return result }

  postMarshallerDialogRelease.func(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post marshaller dialog release error.'
  })
})

/**
 * ///////////////////////////////////////////////////
 * Get item ID list from Wish server
 */
 router.get('/get/wishes', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  // parameter
  const params = {
    version: req.query.version,
    domain: req.query.domain,
    token: req.query.token,
    hmt_id: req.query.hmt_id,
    type: req.query.type,
  }

  // Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  // Set logiD
  params.logiD = req.logiD;
  params.customer_uuid = req.customer_uuid;
  
  // Get Wishes
  await getWishes.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post Wish search error'
  });

  next();
}, adf.Final)

/**
 * ///////////////////////////////////////////////////
 * Create Attachment item to Wish server
 */
 router.post('/post/wish/create', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  // parameter
  const params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    hmt_id: req.body.hmt_id,
    query: req.body.query,
  }

  // Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD;
  params.customer_uuid = req.customer_uuid;
  
  // Post Wish create
  await postWishCreate.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post Wish create error'
  });

  next();
}, adf.Final)

/**
 * ///////////////////////////////////////////////////
 * Delete Attachment item from Wish server
 */
 router.post('/post/wish/delete', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  // parameter
  const params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    hmt_id: req.body.hmt_id,
    query: req.body.query,
  }

  // Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Set logiD
  params.logiD = req.logiD;
  params.customer_uuid = req.customer_uuid;
  
  // Post Wish save
  await postWishDelete.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post Wish delete error'
  });

  next();
}, adf.Final)

/**
 * ///////////////////////////////////////////////////
 * POST wish get details
 * Get wish items with items details
 */
router.post('/post/wish/get/details', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  // parameter
  const params = {
    version: req.body.version,
    domain: req.body.domain,
    token: req.body.token,
    hmt_id: req.body.hmt_id,
  }

  // Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  // Set logiD
  params.logiD = req.logiD;
  params.customer_uuid = req.customer_uuid;
  
  // Post Wish get details
  await postWishGetDetails.func(req, res, params)
  .catch(err => {
    errHandle2Top(err, next)
    return 'post Wish Attachment search error'
  });

  next();
}, adf.Final)

module.exports = router;
