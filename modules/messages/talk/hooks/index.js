const conf = require(REQUIRE_PATH.configure);

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs

const talk_response = require(`./response`);

const rbfaq = require(`./rbfaq`);
const mc = require(`./message_container`);
const attachment = require(`./attachment`);
const dialog = require(`./dialog`);

const response = async ({ns, params, ctalk_quest, logiD}) => {
  const talks = [];
  let hasRbfaq  = false;
  let hasMc     = false;
  let hasDialog = false;
  const messages = ctalk_quest?.message?.split('|') || [];
  const testing = params.testing || false;

  for (let message of messages) {
    let res = null;
    if (rbfaq.is_rbfaq_message(message)) {
      // rulebase faq
      res = await rbfaq.get_rbfaq({ns, message, history: ctalk_quest.history, logiD});
      if (res) { hasRbfaq = true; }
    } else if (mc.is_mc_message(message)) {
      // message container
      res = await mc.get_mc({ns, message, logiD});
      if (res) { hasMc = true; }
    } else if (attachment.is_attachment_message(message)) {
      // attachment
      res = await attachment.get_attachment_command({message, history: ctalk_quest.history, logiD});
    } else if (dialog.is_dialog_message(message)) {
      // dialog
      res = await dialog.get_dialog({ns, message, logiD, testing});
      if (res) { hasDialog = true; }
    }
    if (Array.isArray(res)) {
      talks.push(...res);
    }
  }
  if (!talks.length) { return null; }

  const update_init_interval = async (client) => {
    // update hooks interval
    const update_ustatus = {};
    const updateTime = (new Date).getTime();
    if (hasRbfaq) {
      update_ustatus.init_interval_rbfaq = (conf.init_interval_rbfaq?.[client] || 0) + updateTime;
    }
    if (hasMc) {
      update_ustatus.init_interval_mc = (conf.init_interval_mc?.[client] || 0) + updateTime;
    }
    if (hasDialog) {
      update_ustatus.init_interval_dialog = (conf.init_interval_dialog?.[client] || 0) + updateTime;
    }
    if (hasRbfaq || hasMc || hasDialog) {
      await ds_conf.user.putUserStatus(
        ns,
        String(params.rid),
        String(params.uid),
        update_ustatus,
      );  
    }
  };
  return {
    response: talk_response(talks, params.uuid, params.uid),
    update_init_interval,
  };
};

const get_init_interval = async ({ns, uid, message, logiD}) => {
  const is_rbfaq = rbfaq.is_rbfaq_message(message);
  const is_mc    = mc.is_mc_message(message);
  const is_attachment = attachment.is_attachment_message(message);
  const is_dialog = dialog.is_dialog_message(message);
  if (
    !is_rbfaq &&
    !is_mc &&
    !is_attachment &&
    !is_dialog
  ) { return null; }

  if (is_attachment) {
    return { value: 0 };
  }

  //Get init interval from response_context
  let entity = await ds_conf.user.getUserStatus(ns, String(uid))
  console.log(`=========${logiD} UserProps`,JSON.stringify(entity))
  if (!entity?.length) { return null; }

  //Get init interval
  let init_interval = 0;
  if (is_rbfaq) {
    init_interval = Number(entity[0].init_interval_rbfaq);
  } else if (is_mc) {
    init_interval = Number(entity[0].init_interval_mc);
  } else if (is_dialog) {
    init_interval = Number(entity[0].init_interval_dialog);
  }
  return { value: init_interval };
};

module.exports = {
  response,
  init_interval: get_init_interval,
};