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
 * Register coupons with JSON.
 * @param {*} req 
 * @param {*} res 
 * @param {*} params 
 */
const RegCoupon = async(req, res, params) => {
  const coupons = params.content

  //Set namespace
  const client = req.client
  const ns = req.ns
  let ds_result = []

  for (let i = 0; i < coupons.length; i++) {
    let expire = new Date(coupons[i].expire)
    let result = await ds_conf.createCoupon(ns, coupons[i].name, expire, coupons[i].img_url).catch(err => {throw err})
    ds_result.push(result)
    let cid = result.data.find(entity => entity.name == "coupon_id")?.value
    if (!cid) {throw "Database transaction suceeded but no coupon ID."}
    for (let cci = 0; cci < coupons[i].codes.length; cci++) {
      // "site_url" is currently disabled.
      ds_conf.createCouponCode(ns, cid, coupons[i].codes[cci].code, null).catch(err => {throw err})
    }
  }

  let messages = []

  for (let i=0; i < ds_result.length; i++) {
    let cid = ds_result[i].data.find(elm => elm.name == "coupon_id")?.value
    let cname = ds_result[i].data.find(elm => elm.name == "name")?.value
    messages.push({coupon_id: cid, name: cname})
  }

  const resMessages = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : "Succeeded to register coupons.",
    qty: ds_result.length,
    messages: messages,
  }

  express_res.func(res, resMessages)
  return "Success"
}
module.exports.func = RegCoupon