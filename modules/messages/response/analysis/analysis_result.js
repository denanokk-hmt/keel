//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.analysis


/**
 * modify coupon_details
 * @param {string} ns
 * @param {string} hmt_id
 * @param {object} params
 * @param {object} message
 */
const analysis_result = async ({ns, hmt_id, params, message}) => {
  if (message?.talk?.type != 'analysis_result' || !message?.talk?.content) {
    // オブジェクト形式不正の場合、そのまま返却（処理なし）
    return message;
  }

  //exchange the type of message
  // message.talk.type = "text"

  // Get coupon entity.
  await ds_conf.createAnalysisResult(
    ns,
    hmt_id,
    message.talk.content.analysis_id,
    message.talk.content.analysis_name,
    message.talk.content.message,
  ).catch(err => { throw err })

  return message  
};
module.exports = analysis_result;
