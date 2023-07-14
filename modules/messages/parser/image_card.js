//moduler
const moduler = require(REQUIRE_PATH.moduler);
const msgutil = moduler.utils.message;

const parse = (type, message, content) => {
  const { image, text, link } = content;
  if (image && (typeof link === 'object')) {
    // old ver.
    return {
      type,
      content: {
        message: msgutil.newline2escaped(message),
        image: image || null,
        text:  msgutil.newline2escaped(text || ""),
        link: {
          label: link?.label || null,
          url:   link?.url || null,
        },
      }
    };
  }
  // new ver.
  const { img_url, label } = content;
  return {
    type,
    content: {
      message: msgutil.newline2escaped(message),
      image: img_url || null,
      text:  msgutil.newline2escaped(text || ""),
      link: {
        label: label || null,
        url:   link || null,
      },
    }
  };
};

module.exports = {
  parse,
};
