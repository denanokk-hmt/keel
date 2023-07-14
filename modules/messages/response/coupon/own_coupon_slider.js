//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.coupon


/*
message: {
  talk:{
    {
      "type": "own_coupon_slider",
      "content": {
        "message": "利用可能なクーポンがありません",
        "value": "get_coupon"
      }
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
          "wy_data": "[coupon.coupon_id]",
          "item_value": "[content.value]",
          "item_name": "[coupon.name]",
          "img_url": "[coupon.img_url]",
          "alt": "[coupon.name]",
          "shade": false,
        },
        :
      ]
    }
  }
}

*/
/**
 * modify own_coupon_slider
 * @param {string} ns
 * @param {string} hmt_id
 * @param {object} params
 * @param {object} message
 */
const modify = async ({ns, hmt_id, params, message}) => {
  if (message?.talk?.type != 'own_coupon_slider' || !message?.talk?.content) {
    // オブジェクト形式不正の場合、そのまま返却（処理なし）
    return message;
  }

  // item_image_sliderの形式に変換
  message.talk.type = 'item_image_slider';
  message.talk.content.sliders = [];
  const item_value = message.talk.content.value;
  delete message.talk.content.value;

  // 有効なクーポン一覧を取得（売り切れを含む）
  let coupons = await ds_conf.getCoupons(
    ns,
    null,
    false
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

  // 有効なクーポンから取得済みクーポンのみ抽出
  coupons = coupons.filter(item => own_coupons.find(oitem => oitem.coupon_id == item.coupon_id));

  // messageに情報を付加
  let result = [];
  for (let coupon of coupons) {
    if (coupon) {
      message.talk.content.sliders.push({
        wy_data:    coupon.coupon_id,
        item_value: item_value,
        shade:      false,  // 取得済みはシェード表示なし
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
