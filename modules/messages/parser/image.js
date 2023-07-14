//moduler
const moduler = require(REQUIRE_PATH.moduler);
const msgutil = moduler.utils.message;

const parse = (type, message, content) => {
  return {
    type,
    content: {
      message: msgutil.newline2escaped(message),
      img_url: content?.img_url || null,
      alt:     content?.alt || null,
    }
  };
};

module.exports = {
  parse,
};
