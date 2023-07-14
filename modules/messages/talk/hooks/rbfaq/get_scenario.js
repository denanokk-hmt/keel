//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs.rulebase

/**
 * rbfaq get list
 * @param {string} ns
 * @param {string} response_id
 * @param {string} logiD
 * @param {string} scenario_id
 */
 const rbfaq_get_scenario = async ({ ns, response_id, logiD, scenario_id }) => {

  const res_scenario = await ds_conf.getRulebaseScenario(ns, scenario_id)

  if (res_scenario?.result?.length != 1 || !res_scenario?.result[0]?.response_id) {
    return null
  } else {
    console.log(`=========${logiD} HIT FROM RULEBASE SCENARIO===========`)
    return res_scenario?.result[0]
  }
}

module.exports = rbfaq_get_scenario;