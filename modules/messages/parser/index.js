const types      = require("../types");

const text       = require("./text");
const image      = require("./image");
const image_card = require("./image_card");
const youtube    = require("./youtube");
const connect_operator = require("./connect_operator");
const attachment = require("./attachment");
const spltag = require("./spltag");
const message_container = require("./message_container");
const markdown = require("./markdown");

const { parser: itemsParser , types: itemTypes } = require("./items");

const contentTypes = {
  [types.TEXT]:          text,
  [types.MSG_CONTAINER]: message_container,

  [types.IMAGE]:      image,
  [types.IMAGE_CARD]: image_card,
  [types.YOUTUBE]:    youtube,

  [types.CONNECT_OP]: connect_operator,
  [types.ATTACHMENT]: attachment,
  [types.SPLTAG]:     spltag,

  [types.LIST]:         itemsParser(itemTypes.CHIPS),
  [types.STR_VAL_CHIP]: itemsParser(itemTypes.CHIPS),
  [types.STR_STR_CHIP]: itemsParser(itemTypes.CHIPS),

  [types.LINK_IMG_SLIDER]:   itemsParser(itemTypes.SLIDERS),
  [types.ITEM_IMG_SLIDER]:   itemsParser(itemTypes.SLIDERS),
  [types.YOUTUBE_SLIDER]:    itemsParser(itemTypes.SLIDERS),
  [types.ATTACHMENT_SLIDER]: itemsParser(itemTypes.SLIDERS),

  [types.MARKDOWN]: markdown,
};

const parser = (type, message, content) => {
  const contentType = contentTypes[type];
  if (!contentType) {
    throw new Error('invalid message type.');
  }
  return contentType.parse(type, (message || ''), content);
};
module.exports = parser;