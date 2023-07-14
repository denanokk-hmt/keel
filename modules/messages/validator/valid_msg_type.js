const types  = require(`${REQUIRE_PATH.modules}/messages/types`);
/**
 * message type.
 * @param {Array} messages
 */
const valid_msg_types = (messages, logiD, client) => {
  const messageTypes = Object.values(types);
  for (let msg of messages) {
    if (messageTypes.indexOf(msg.talk?.type) === -1) {
      console.error(`=========${logiD} FAILED INVALID MESSAGE TYPE type:${msg.talk?.type} client: ${client}===========`);
      return false
    }
  }
  return true
};
module.exports = valid_msg_types;