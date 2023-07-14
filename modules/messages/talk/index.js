//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const ds_conf = moduler.kvs
const msgutil = moduler.utils.message  // PENDING: HOW TREAT NEWLINES?

const hooks = require('./hooks');

/**
 * treat messages
 * @param {object} ns
 * @param {object} params
 * @param {object} ctalk_quest
 */
const treatMessages = async({ns, hmt_id, params, ctalk_quest, logiD}) => {
  // Treating messages. (common)
  // something...
  const result = {}

  // Treating messages. (by talk_type)
  switch (params.talk_type) {
    case "survey":
      // Potentially unneeded await.
      await ds_conf.survey.createSurvey(
        ns,
        String(hmt_id), //hmt_id
        String(params.wy_data.item_id || ''), //sid
        String(params.talk_quest).replace(/\r?\n/g,""), //item_name
        String(params.talk_value).replace(/\r?\n/g,""),  //item_value
        String(params.wy_data.survey_id), //sid
        String(params.wy_data.question_id), //qid
        String(params.wy_data.question), //question
      ).catch(err => { throw err });
      break;

    case "analysis":
      // Potentially unneeded await.
      await ds_conf.analysis.createAnalysis(
        ns,
        String(hmt_id), //hmt_id
        String(params.wy_data.item_id || ''), //item_id
        String(params.talk_quest).replace(/\r?\n/g,""), //item_name
        String(params.talk_value).replace(/\r?\n/g,""),  //item_value
        String(params.wy_data.analysis_id), //aid
        String(params.wy_data.question_id), //qid
        String(params.wy_data.question), //question
      ).catch(err => { throw err });
      break;
  
    default:
      // Nothing to do.
      break;
  }

  // Treating messages. (common)

  // get hooks (If conditions of rbfaq or mc are not match, do nothing)
  result.hooks = await hooks.response({ns, params, ctalk_quest, logiD});

  // something...
  return result
};

module.exports.treatMessages = treatMessages;