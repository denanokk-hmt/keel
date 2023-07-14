//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.rulebase

/**
 * rbfaq get list
 * @param {string} ns
 * @param {string} response_id
 * @param {string} logiD
 */
 const rbfaq_get_list = async ({ ns, response_id, logiD }) => {

  // get children (search response_id as parent_id from rbfaq)
  const items = await ds_conf.getRulebaseList(ns, response_id, logiD)
  .catch(err => { throw err });
  
  if (items?.result?.length > 0) {
    // response_id has children.
    console.log(`=========${logiD} HIT FROM RULEBASE FAQ===========`)

    //sort by response_id
    items?.result?.sort(function (a, b) {
      // ignore upper and lowercase
      let a_response_id = a.response_id.toUpperCase()
      let b_response_id = b.response_id.toUpperCase()
      if (a_response_id > b_response_id) {
        return 1;
      } else {
        return -1;
      }
    })

    return {
      type: "list",
      result: items?.result,
      comment: items?.comment
    }
  }
  
  // get rbfaq (search response_id from rbfaq)
  const [item] = await ds_conf.getRulebaseResponses(ns, response_id, logiD)
  .catch(err => { throw err });

  if (item) {
    console.log(`=========${logiD} HIT FROM RULEBASE FAQ===========`)
    return {
      type: "item",
      result: item
    }
  }
  console.log(`=========${logiD} NOT EXISTS RULEBASE FAQ===========`)
  return null
}

module.exports = rbfaq_get_list;