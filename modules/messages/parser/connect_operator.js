const TYPE_COMMAND    = "command";
const COMMAND_MESSAGE = "connect_operator";

const parse = (type, message, content) => {
  return {
    type: TYPE_COMMAND,
    content: {
      message: COMMAND_MESSAGE,
    }
  };
};

module.exports = {
  parse,
};
