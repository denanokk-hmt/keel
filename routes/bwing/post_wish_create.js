'use strict';

// config
const conf = require(REQUIRE_PATH.configure);
// express
const express_res = conf.express_res;
// moduler
const moduler = require(REQUIRE_PATH.moduler);
// System modules
const { postRequest } = moduler.http;

/**
 * Post Request: Create Attachment Item
 * @param {string} client
 * @param {Object} params
 * @returns {Object} response
 */
const postAttachmentItemCreate = async (client, params, query) => {
  const data = {
    ...params,
    item_id: query.item_id,
  };
  /////////////////////////////
  // Post create item ID to Wish Server
  const url = `https://${conf.domains_wish[client]}/${conf.env.routes.url_api}/${client}/post/attachment/item/create`;
  const response = await postRequest('POST', url, data)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${logiD} Wish create Attachment item API fail - url:${url}, data:${JSON.stringify(data)}`);
      throw err;
    });
  return response;
};

/**
 * Post Request: Create SpecialTag Item
 * @param {string} client
 * @param {Object} params
 * @returns {Object} response
 */
const postSpecialTagItemCreate = async (client, params, query) => {
  const data = {
    ...params,
    item_key: query.item_key,
    tag_id: query.tag_id,
  };
  /////////////////////////////
  // Post create item ID to Wish Server
  const url = `https://${conf.domains_wish[client]}/${conf.env.routes.url_api}/${client}/post/specialtag/item/create`;
  const response = await postRequest('POST', url, data)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${logiD} Wish create SpecialTag item API fail - url:${url}, data:${JSON.stringify(data)}`);
      throw err;
    });
  return response;
};

/**
 * Post create Attachment item id in Wish Server
 * @param {*} req
 * @param {*} res
 * @param {*} params
 */
const postWishCreate = async (req, res, params) => {
  const logiD = req.logiD;
  console.log(`=========${logiD} POST WISH CREATE===========`);

  const client = req.client;
  const data = {
    logiD: req.logiD,
    customer_uuid: params.customer_uuid,
    version: params.version,
    hmt_id: params.hmt_id,
  };
  const type = params.query.type;

  let response;
  switch (type) {
    case 'spltag':
      response = await postSpecialTagItemCreate(client, data, params.query);
      break;
    case 'attachment':
    default:
      response = await postAttachmentItemCreate(client, data, params.query);
      break;
  }

  const result = {
    type: response?.type,
    status_code: response?.status_code,
    status_msg: response?.status_msg,
    [type]: {
      item: {
        wish_flag: response?.wish_flag ?? false,
      },
    },
  };

  /////////////////////////////
  // Response
  express_res.func(res, result);
};
module.exports.func = postWishCreate;
