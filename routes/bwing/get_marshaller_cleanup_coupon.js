'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.coupon


/**
 * Flagging coupons.
 * @param {*} req 
 * @param {*} res 
 * @param {*} params 
 */
const cleanCoupon = async(req, res) => {
  //Set namespace
  const client = req.client
  const ns = req.ns

  const now = new Date()

  // Get no dflg coupons.
  let result = await ds_conf.getCoupons(ns, null, false, true).catch(err => {throw err})

  for (let i=0; i < result.length; i++) {
    if (result[i].expire && result[i].expire < now) {
      console.log(`COUPON ${result[i].coupon_id} will be disabled.`)
      let dr = await ds_conf.updateCoupon(ns, result[i].coupon_id, result[i].name, result[i].expire, true, result[i].sflg, result[i].img_url, result[i].udt, now)
    }
  }

  // Get neither dflg nor sflg coupons.
  result = await ds_conf.getCoupons(ns, null, true).catch(err => {throw err})

  for (let i=0; i < result.length; i++) {
    let empty_coupon = await ds_conf.getEmptyCouponCodes(ns, result[i].coupon_id).catch(err => {throw err})
    if (empty_coupon.length < 1) {
      console.log(`COUPON ${result[i].coupon_id} was sold out.`)
      // no wait.
      ds_conf.updateCoupon(ns, result[i].coupon_id, result[i].name, result[i].expire, result[i].dflg, true, result[i].img_url, result[i].udt, now)
    }
  }

  const resMessages = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "Succeeded to cleanup coupons."
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = cleanCoupon