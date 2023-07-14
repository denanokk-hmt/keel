//moduler
const moduler = require(REQUIRE_PATH.moduler);
//System modules
const ds_conf = moduler.kvs.message_container;

const types  = require(`${REQUIRE_PATH.modules}/messages/types`);
const parser = require(`${REQUIRE_PATH.modules}/messages/parser`);

const response_id_prefix = 'MC_';
const mc_prefix = [
  response_id_prefix,
];

const is_mc_message = (message) => {
  return mc_prefix.find(elm => message?.startsWith(elm));
};

module.exports.is_mc_message = is_mc_message;

const get_response = async ({ ns, message, logiD }) => {
  const response_id = message || null;
  if (!response_id) { return null; }

  // create ns for get rbfaq
  const ns_split = ns.split("-");
  const mcns = `${ns_split[0]}-MessageContainer-${ns_split[1]}-${ns_split[2]}`;

  // get mc message
  return await ds_conf.getMessageContainerById(mcns, response_id);
};
const get_mc = async ({ ns, message, logiD }) => {
  // get mc message
  const response = await get_response({ ns, message, logiD });
  if (!response) {
    console.log(`=========${logiD} NOT EXISTS MC MESSAGE [${message}]===========`);
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
      const res = await get_response({ ns, message: msg, logiD });
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
module.exports.get_mc = get_mc;