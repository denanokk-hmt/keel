const addQueryParts = (query) => {
  let parts = [];
  for (let key in query) {
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(query[key]));
  }

  if (parts.length) return "?" + parts.join("&");

  return "";
};


const encodeQueryParts = (parts) => {
  let result = {};

  for (let k in parts) {
    let value = parts[k];
    if (typeof value === "string") {
      result[k] = value;
    } else if (typeof value === "number") {
      result[k] = value + "";
    } else if (Array.isArray(value)) {
      result[k] = value.join(",");
    } else {
      let subParts = encodeQueryParts(value);
      for (let subKey in subParts) {
        result[k + "[" + subKey + "]"] = subParts[subKey];
      }
    }
  }

  return result;
};

module.exports = {encodeQueryParts,addQueryParts};