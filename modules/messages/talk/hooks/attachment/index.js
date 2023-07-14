const types  = require(`${REQUIRE_PATH.modules}/messages/types`);
const parser = require(`${REQUIRE_PATH.modules}/messages/parser`);

const message_prefix = 'AT_';
const at_prefix = [
  message_prefix,
];

const is_attachment_message = (message) => {
  return at_prefix.find(elm => message?.startsWith(elm));
};
module.exports.is_attachment_message = is_attachment_message;

const get_attachment_command = async ({ message, history, logiD }) => {
  const tag = (message || '').replace(/^AT_/, '');
  if (!tag) {
    console.log(`=========${logiD} NOT EXISTS ATTACHMENT TAG [${message}]===========`);
    return null;
  }

  // parse message
  const result = [];
  try {
    const t = parser(types.ATTACHMENT, history, {
      type: 'sample',
      tags: [tag],
      force: false,
    });
    if (t) { result.push(t); }
  }
  catch (err) {
    console.log(err, message);
    return null;
  }

  return result;
};
module.exports.get_attachment_command = get_attachment_command;