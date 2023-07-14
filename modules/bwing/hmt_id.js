'use strict';

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const crypto = moduler.crypto


/**
 * generate
 *   hashMac id:uid, pw:rid
 * @param uid
 * @param rid
 */
function generate(uid, rid) {
  const hmt_id = crypto.hashMac(uid, rid).token;
  console.log('generate hmt_id', uid, rid, hmt_id);
  return String(hmt_id);
}
module.exports.generate = generate;

