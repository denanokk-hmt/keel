const TYPE_COMMAND    = "command";
const COMMAND_MESSAGE = "spltag";

const parse = (type, message, content) => {
  return {
    type: TYPE_COMMAND,
    content: {
      message: COMMAND_MESSAGE,
      spltag: {
        force: content?.force || false,
        message: message,
        tags: content?.tags || [],
        type: content?.type || "sample",
      }
    }
  };
};

module.exports = {
  parse,
};
