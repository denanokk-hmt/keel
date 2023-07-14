//moduler
const types      = require("../types");

const { parse: textParser } = require('./text');

const parse = (type, message, content) => {
  return textParser(types.TEXT, message, content);
};

module.exports = {
  parse,
};
