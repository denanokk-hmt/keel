//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.coupon
const ds_smsg = moduler.kvs.sysmsg

const treatCouponMessage = (msg, name=null, code=null) => {
  return msg.replace('$NAME$', (name || "")).replace('$CODE$', (code || ""))
}

/**
 * modify coupon_details
 * @param {string} ns
 * @param {string} hmt_id
 * @param {object} params
 * @param {object} message
 */
const coupon_details = async ({ns, hmt_id, params, message}) => {
  if (message?.talk?.type != 'coupon' || !message?.talk?.content) {
    // オブジェクト形式不正の場合、そのまま返却（処理なし）
    return message;
  }

  //exchange the type of message
  message.talk.type = "text"

  // Get coupon entity.
  const ds_result = await ds_conf.getCoupons(
    ns,
    params.wy_data,
    false
  ).then(result => { return result[0] })
   .catch(err => { throw err })

  if (!ds_result) {
    const msg_content = await ds_smsg.getSysmsgFor(ns, "coupons_expired")
    message.talk.content.message = msg_content
    return message
  }
  const name = ds_result.name

  //get coupon code
  let ccode
  try {
    ccode = await ds_conf.getCouponCode(
      ns,
      params.wy_data,
      hmt_id
    )
  } catch(err) {
    console.log(err)
    const msg_content = await ds_smsg.getSysmsgFor(ns, "coupons_error")
    ccode = {error: treatCouponMessage(msg_content, name)}
  }
  
  if　(ccode?.error) {
    message.talk.content.message = ccode.error
  } else if (!ccode?.code) {
    const msg_content = await ds_smsg.getSysmsgFor(ns, "coupons_soldout")
    message.talk.content.message = name + treatCouponMessage(msg_content, name)
  } else {
    message.talk.content = {
      ...message.talk.content,
      message: treatCouponMessage(message.talk.content.message, name, ccode.code),
      coupon_id: params.wy_data,
      coupon_name: name,
      coupon_code: ccode.code
    }
  }
  return message  
};
module.exports = coupon_details;
