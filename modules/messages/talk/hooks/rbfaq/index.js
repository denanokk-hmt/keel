const rbfaq_list = require(`./get_list`)
const rbfaq_get_scenario = require(`./get_scenario`)
const rbfaq_parse_item = require("./message_parser")

const rbfaq_base  = 'rulebase_faq'
const rbfaq_child = 'RB_'
const rbfaq_scenario = 'RBS_'
const rbfaq_prefix = [
  rbfaq_base,
  rbfaq_child,
  rbfaq_scenario,
]
const default_talk_obj = {
  list: {
    type: "list",
  },
  text: {
    type: "text",
  }
}
const is_rbfaq_message = (message) => {
  return rbfaq_prefix.find(elm => message?.startsWith(elm))
}
module.exports.is_rbfaq_message = is_rbfaq_message

const get_rbfaq = async ({ ns, message, history, logiD }) => {
  // check rbfaq target
  if (!is_rbfaq_message(message)) { return null }

  // create ns for get rbfaq
  const ns_split = ns.split("-")
  const rbns = `${ns_split[0]}-Rulebase-${ns_split[1]}-${ns_split[2]}`
  let response_id = message?.startsWith(rbfaq_child) ? message : null
  const talks = []
  let scenario_res
  const scenario_id = message?.startsWith(rbfaq_scenario) ? message : null
  if (scenario_id) {
    //シナリオをRBS_で検索
    scenario_res = await rbfaq_get_scenario({ ns: rbns, scenario_id, logiD })
    if (scenario_res) {
      response_id = scenario_res.response_id
      if (scenario_res.scenario_comment) {
        talks.push({
          ...default_talk_obj['text'],
          content: {
            message: scenario_res.scenario_comment?.replace(/\r?\n/g, '\\n')
          }
        })
      }
    } else {
      return null
    }
  }
  const res = await rbfaq_list({ ns: rbns, response_id: response_id, logiD })
  if (!res) { return null }
  const { type, result, comment } = res
  switch (type) {
    case "list":
      let message
      if (scenario_res) {
        message = scenario_res?.message
      } else {
        message = (message?.startsWith(rbfaq_child)) ? history : (comment || "").replace(/\r?\n/g, '\\n')
      }
      talks.push({
        ...default_talk_obj['list'],
        content: {
          message: message,
          chips: result.filter(elm => (elm.message != undefined) && (!Boolean(elm?.scenario_is_hide))).map((item) => {
            return {
              item_name: item.message,
              item_value: item.response_id
            }
          })
        }
      })
      break;
    case "item":
      const item_data = rbfaq_parse_item(result)
      if (!item_data) {
        return null;
      }
      talks.push(item_data)
      break;
    default:
      return null;
  }
  return talks;
}
module.exports.get_rbfaq = get_rbfaq