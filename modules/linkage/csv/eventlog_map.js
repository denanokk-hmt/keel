const eventLogMap = {
  "reqlogin": {
    category_id: 1000,
    id: 80001,
  },
  "locked-video": {
    category_id: 2001,
    id: 90001,
  },
  "unlock-video": {
    category_id: 2001,
    id: 90002,
  },
  "show-video": {
    category_id: 2001,
    id: 90003,
  },
  "locked-coupon": {
    category_id: 3001,
    id: 90001,
  },
  "unlock-coupon": {
    category_id: 3001,
    id: 90002,
  },
  "show-coupon": {
    category_id: 3001,
    id: 90003,
  },
  "survey": {
    category_id: 4001,
    id: 90001,
  },
  "survey-first": {
    category_id: 4001,
    id: 90002,
  },
  "survey-last": {
    category_id: 4001,
    id: 90003,
  },
  "analysis": {
    category_id: 5001,
    id: 90001,
  },
  "analysis-start": {
    category_id: 5001,
    id: 90002,
  },
  "analysis-result": {
    category_id: 5001,
    id: 90003,
  },
  "analysis-result-detail": {
    category_id: 5001,
    id: 90004,
  },
  itemTest: {
    category_id: 9999999,
    id: 9990001,
  },
}

module.exports.map = eventLogMap

/*
categoryID:
  1000:    Generic
  2001:    ちょい見せ動画
  3001:    クーポン
  4001:    アンケート
  5001:    診断
  9999999: Test
*/
