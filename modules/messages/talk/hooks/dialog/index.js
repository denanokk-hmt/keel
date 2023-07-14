//moduler
const moduler = require(REQUIRE_PATH.moduler);
//System modules
const ds_conf = moduler.kvs.dialog;

const types  = require(`${REQUIRE_PATH.modules}/messages/types`);
const parser = require(`${REQUIRE_PATH.modules}/messages/parser`);

const response_id_prefix = 'DI_';
const dialog_prefix = [
  response_id_prefix,
];

const is_dialog_message = (message) => {
  return dialog_prefix.find(elm => message?.startsWith(elm));
};

module.exports.is_dialog_message = is_dialog_message;

const get_response = async ({ ns, message, logiD, testing }) => {
  const response_id = message || null;
  if (!response_id) { return null; }

  // create ns for get rbfaq
  const ns_split = ns.split("-");
  const dialogns = `${ns_split[0]}-Dialog-${ns_split[1]}-${ns_split[2]}`;

  // get dialog message
  return await ds_conf.getDialogMessage(dialogns, response_id, testing);
};
const get_dialog = async ({ ns, message, logiD, testing }) => {
  // get dialog message
  const response = await get_response({ ns, message, logiD, testing });
  if (!response) {
    console.log(`=========${logiD} NOT EXISTS DIALOG MESSAGE [${message}]===========`);
    return null;
  }

  const talks = [];
  try {
    const talk_obj = JSON.parse(response?.talk);
    if (talk_obj) { talks.push(talk_obj); }
  }
  catch (err) {
    console.log(err);
    return null;
  }

  // convert parent message
  if (talks[0]?.type === types.MSG_CONTAINER) {
    const msgs = talks[0].content?.values || [];
    for (let msg of msgs) {
      const res = await get_response({ ns, message: msg, logiD, testing });
      if (!res) { continue; }
      try {
        const t = JSON.parse(res?.talk);
        if (t) { talks.push(t); }
      }
      catch (err) {
        console.log(err);
      }
    }
  }

  // parse message
  const result = talks.reduce((ary, talk) => {
    try {
      const t = parser(talk.type, talk.message, talk.content);
      if (t) { ary.push(t); }
    }
    catch (err) {
      console.log(err, talk);
    }
    finally {
      return ary;
    }
  }, []);
  return result;
};
module.exports.get_dialog = get_dialog;