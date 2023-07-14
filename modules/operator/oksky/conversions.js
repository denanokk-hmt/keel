'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status
const moduler = require(REQUIRE_PATH.moduler)
const msgutil = moduler.utils.message

const convertWhatYaToOkSkyMessage = ctalk => {
  return {
    kind: ctalk.type,
    content: msgutil.escaped2newline(ctalk.content.message),
    settings: {
      src_url: ctalk.content.img_url || "",
      alt: ctalk.content.alt || "",
    },
    created_at_unix: ctalk.mtime ? ctalk.mtime / 1000 : Date.now().toString(),
  }
};


const getRelationships = ({oksky_room_id, oksky_customer_id}) => {
  console.log("getRelationships ARGS", oksky_room_id, oksky_customer_id)

  let relationships = {init: 1};

  if (oksky_room_id) {
    relationships['room'] = {data: {type: "rooms", id: oksky_room_id}};
    delete relationships["init"];
  }

  if (oksky_customer_id) {
    relationships['user'] = {data: {type: "users", id: oksky_customer_id}};
    delete relationships["init"];
  }

  return relationships;
};

const prepareMessageForOkSky = ({ctalk, oksky_room_id, oksky_customer_id}) => {

  const okSkyMessage = convertWhatYaToOkSkyMessage(ctalk);
  const relationships = getRelationships({oksky_room_id, oksky_customer_id});

  return {
    data: {
      type: "messages",
      relationships: {...relationships},
      attributes: {
        ...okSkyMessage
      }
    }
  };
};

const convertOkSkyToWhatYaMessage = okSkyMessage => {
  return {
    mtime: okSkyMessage.attributes.created_at_unix * 1000,
    talk: {
      type: okSkyMessage.attributes.kind,
      content: {
        message: okSkyMessage.attributes.content,
        img_url: okSkyMessage.attributes.settings.src_url,
        alt: okSkyMessage.attributes.settings.alt,
      }
    }
  }
};


////////////////////////////////////////////
/**
 * Prepare for op recieve message
 * @param {*} params 
 */
const prepareMessageForWhatYa = ({params}) => {
  
  console.log("prepareMessageForWhatYa ARGS", JSON.stringify(params))

  const dt = new Date()
  const ut = dt.getTime()
  return {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : status.SUCCESS_ZERO,
    qty: 1,
    messages : [{
      mtime: ut,
      mtype: 'operator',
      talk: {
        type: params.talk_type,
        content: params.content,
        cdt: dt,
      }        
    }]
  }
};

module.exports = {convertOkSkyToWhatYaMessage, prepareMessageForOkSky, prepareMessageForWhatYa};