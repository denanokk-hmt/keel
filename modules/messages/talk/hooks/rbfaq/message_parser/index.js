const parser = require(`${REQUIRE_PATH.modules}/messages/parser`)

const TYPE_TEXT = 'text';
const rbfaq_parse_item = (rbfaq) => {
  const decodedContent =
    typeof rbfaq.content === "string" ? JSON.parse(rbfaq.content) : {};

  const type = decodedContent?.type || TYPE_TEXT;
  const response = rbfaq.response || (type === TYPE_TEXT ? rbfaq.message : "");
  try {
    return parser(type, response, decodedContent);
  }
  catch (err) {
    console.error(`Unsupported Message-Type: [${decodedContent.type}]`)
    return null;
  }
};

module.exports = rbfaq_parse_item;
