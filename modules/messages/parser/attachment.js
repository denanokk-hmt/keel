const TYPE_COMMAND    = "command";
const COMMAND_MESSAGE = "attachment";

const parse = (type, message, content) => {
  return {
    type: TYPE_COMMAND,
    content: {
      message: COMMAND_MESSAGE,
      attachment: {
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
