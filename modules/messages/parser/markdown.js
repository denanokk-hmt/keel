//moduler
const moduler = require(REQUIRE_PATH.moduler);
const msgutil = moduler.utils.message;

const parse = (type, message, content) => {
  if (!message) {
    throw new Error('message is null.');
  }
  return {
    type,
    content: {
      message: message,
    }
  };
};

module.exports = {
  parse,
};
