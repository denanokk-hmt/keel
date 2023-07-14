//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.coupon


/*
message: {
  talk:{
    "type": "coupon_slider",
    "content": {
      "message": "利用可能なクーポンがありません",
      "sliders": [
        {
          "item_name": "coupA",
          "item_value": "GETCOUPON",
          "shade": false,
        },
        {
          "item_name": "coupB",
          "item_value": "GETCOUPON",
          "shade": false,
        },
        {
          "item_name": "coupC",
          "item_value": "GETCOUPON",
          "shade": false,
        }
      ]
    }
  }
}
=>
message: {
  talk:{
    "type": "item_image_slider",
    "content": {
      "message": "[表示クーポンがある場合は空に置換、ない場合はmessageの値をそのまま返却]",
      "sliders": [
        {
          "wy_data": "coupA",
          "item_value": "GETCOUPON",
          "item_name": "[coupon.name]",
          "img_url": "[coupon.img_url]",
          "alt": "[coupon.name]",
          "shade": false,
        },
        {
          "wy_data": "coupB",
          "item_value": "GETCOUPON",
          "item_name": "[coupon.name]",
          "img_url": "[coupon.img_url]",
          "alt": "[coupon.name]",
          "shade": false,
        },
        {
          "wy_data": "coupC",
          "item_value": "GETCOUPON",
          "item_name": "[coupon.name]",
          "img_url": "[coupon.img_url]",
          "alt": "[coupon.name]",
          "shade": false,
        }
      ]
    }
  }
}

*/
/**
 * modify coupon_slider
 * @param {string} ns
 * @param {string} hmt_id
 * @param {object} params
 * @param {object} message
 */
const modify = async ({ns, hmt_id, params, message}) => {
  if (['coupon_slider', 'locked_coupon_slider'].indexOf(message?.talk?.type) == -1 || !message?.talk?.content) {
    // オブジェクト形式不正の場合、そのまま返却（処理なし）
    return message;
  }

  // item_image_sliderの形式に変換
  const locked = (message.talk.type == 'locked_coupon_slider');
  message.talk.type = 'item_image_slider';
  const sliders = message.talk.content.sliders;
  message.talk.content.sliders = [];
  if (!sliders.length) {  
    // 表示クーポン設定無し
    return message;
  }

  // 売り切れを除く有効なクーポン一覧を取得
  let coupons = await ds_conf.getCoupons(
    ns,
    null,
    true
  ).catch(err => {throw err});
  if (!coupons?.length) {
    // 有効なクーポン無し
    return message;
  }

  // 取得済みのクーポン一覧を取得
  const own_coupons = await ds_conf.getOwnCouponCodes(
    ns,
    null,
    hmt_id
  ).catch(err => {throw err});

  // 有効なクーポンから取得済みクーポンを除外
  coupons = coupons.filter(item => !own_coupons.find(oitem => oitem.coupon_id == item.coupon_id));

  // messageに情報を付加（lockedの場合はwy_dataにcoupon_id=null、shade=trueを設定）
  for (let slider of sliders) {
    let coupon = coupons.find(item => item.coupon_id == slider.item_name);
    if (coupon) {
      message.talk.content.sliders.push({
        wy_data:    locked ? null : slider.item_name,
        item_value: slider.item_value,
        shade:      locked ? true : (slider.shade || false),
        item_name:  coupon.name,
        img_url:    coupon.img_url,
        alt:        coupon.name,
      });
    }
  }
  if (message.talk.content.sliders.length) {
    // 有効なクーポンがある場合はmessageを空に設定
    message.talk.content.message = "";
  }
  return message;
};
module.exports = modify;
