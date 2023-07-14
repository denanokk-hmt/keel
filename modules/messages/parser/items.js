//moduler
const moduler = require(REQUIRE_PATH.moduler);
const msgutil = moduler.utils.message;

const types      = require("../types");

const youtube_re_long  = new RegExp(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=(?<id>[^&]+)/);  // YouTubeのアドレス
const youtube_re_short = new RegExp(/^https?:\/\/youtu\.be\/(?<id>.*)/); // YouTubeの短縮アドレス

const convertYoutubeIdToImgUrl = (youtube_id) => {
  let match = youtube_id.match(youtube_re_long);
  if (!match) {
    match = youtube_id.match(youtube_re_short);
  }
  if (match && match.groups) {
    return `https://img.youtube.com/vi/${match.groups.id}/mqdefault.jpg`; // hqdefault?
  }
  return `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg`;
};

const attachment_prefix = 'AT_';

const convertType = (type) => {
  switch (type) {
    case types.YOUTUBE_SLIDER:
    case types.ATTACHMENT_SLIDER:
      return types.ITEM_IMG_SLIDER;
    default:
      break;
  }
  return type;
};
const parser = (itemType) => {
  const parse = (type, message, content) => {
    const { items } = content;
    const youtube      = (type === types.YOUTUBE_SLIDER);
    const value_prefix = (type === types.ATTACHMENT_SLIDER) ? attachment_prefix : '';

    const results = [];
    for (let item of (items || [])) {
      const { name, value, link, img_url, alt, youtube_id } = item;
      if (!name) { continue; }

      const obj = {
        item_name: name,
        item_value: value_prefix + (value || name),
      }
      if (link)    { obj.link = link; }
      if (img_url) { obj.img_url = img_url; }
      if (alt)     { obj.alt = alt; }
  
      // convert youtube id to img_url if youtube_slider
      if (youtube && youtube_id) {
        obj.img_url = convertYoutubeIdToImgUrl(youtube_id);
      }
      results.push(obj);
    }
    return {
      type: convertType(type),   // convert type (ex. if youtube_slider, convert to item_image_slider.)
      content: {
        message: msgutil.newline2escaped(message),
        [itemType]: results,
      }
    };
  };
  return {
    parse,
  };
};
const itemTypes = {
  CHIPS:   'chips',
  SLIDERS: 'sliders',
};
module.exports = {
  types: itemTypes,
  parser: parser,
};
