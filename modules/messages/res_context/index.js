//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs
const crypto = moduler.crypto

const setState = async({res_context, ns, rid, uid, params}) => {

  //※APIパラメータから設定する場合はここでparamsから設定

  //user_status
  let [userStatus] = await ds_conf.user.getUserStatus(ns, String(uid));
  for(let key of ['signin_flg']){
    if (userStatus?.hasOwnProperty(key)) {
      // UserStateにプロパティが存在する場合はres_contextのStateにその値を設定する
      res_context[key] = userStatus[key];
    } else {
      // res_contextに設定されたStateはWatsonからの応答と共に返却され、その値を以降の処理でDSに再設定される
      // そのため、UserStatusからプロパティが削除された場合にもres_contextに残り続けてしまうため、存在しない場合には明示的に削除する
      // ※ただし基本的にはUserStatusからプロパティが削除されることはない想定
      delete res_context[key];
    }  
  }

  return res_context;
}

/**
 * get res_context
 * @param {object} ns
 * @param {object} params
 * @param {object} ctalk_quest
 */
const getResContext = async({ns, rid, uid, params}) => {
  //Get response_context
  let res_context = '';
  let entity = await ds_conf.user.getUserResContext(ns, String(uid));

  //response_context initial setting
  if (params.talk_type == 'init') {
    res_context = { response_context: '', };
  } else if (!entity || !entity[0]?.response_context || !entity[0]?.response_context.length) {
    res_context = { response_context: '' };
  } else {
    res_context = JSON.parse(entity[0]?.response_context);
  }

  //Set uuid
  if (!res_context.uuid) {
    res_context.uuid = `${crypto.seedRandom16()}_${(new Date).getTime()}`;
  }

  //Set res_context State
  res_context = await setState({res_context, ns, rid, uid, params});

  return res_context;
};

module.exports.getResContext = getResContext;