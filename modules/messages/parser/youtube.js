//moduler
const moduler = require(REQUIRE_PATH.moduler);
const msgutil = moduler.utils.message;

const parse = (type, message, content) => {
  const { videoId, autoplay, invokeEnded } = content;
  return {
    type,
    content: {
      message: msgutil.newline2escaped(message),
      videoId: videoId || null,
      autoplay: Boolean(autoplay) || false,
      invokeEnded: Boolean(invokeEnded) || false,
    }
  };
};

module.exports = {
  parse,
};
