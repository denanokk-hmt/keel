'use strict';

// config
const conf = require(REQUIRE_PATH.configure);
// express
const express_res = conf.express_res;
// moduler
const moduler = require(REQUIRE_PATH.moduler);
// System modules
const { getRequest } = moduler.http;

/**
 * Fetch AttachmentItems ID list from Wish Server
 * @param {string} client
 * @param {Object} params
 * @returns
 */
const getAttachmentItemIdList = async (client, params) => {
  // Post item ID list search to Wish Server
  const url = `https://${conf.domains_wish[client]}/${conf.env.routes.url_api}/${client}/get/attachment/items`;
  const response = await getRequest(url, params)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${logiD} Wish API fail - url:${url}, data:${JSON.stringify(data)}`);
      throw err;
    });
  return response;
};

/**
 * Fetch SpecialTagItems key list from Wish Server
 * @param {string} client
 * @param {Object} params
 * @returns
 */
const getSpecialtagItemKeyList = async (client, params) => {
  // Post item ID list search to Wish Server
  const stTime = new Date().getTime();
  const url = `https://${conf.domains_wish[client]}/${conf.env.routes.url_api}/${client}/get/specialtag/items`;
  const response = await getRequest(url, params)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${logiD} Wish API fail - url:${url}, data:${JSON.stringify(data)}`);
      throw err;
    });
  const apiTime = new Date().getTime() - stTime;
  console.log('Wish API ms:', apiTime);
  return response;
};

/**
 * Post item id List search to Wish Server
 * @param {*} req
 * @param {*} res
 * @param {*} params
 */
const getWishes = async (req, res, params) => {
  const logiD = req.logiD;
  console.log(`=========${logiD} GET WISH ===========`);

  const client = req.client;
  const type = params.type;
  const data = {
    logiD: logiD,
    customer_uuid: req.customer_uuid,
    version: params.version,
    hmt_id: params.hmt_id,
  };

  let response;
  let result_items;
  switch (type) {
    case 'spltag':
      response = await getSpecialtagItemKeyList(client, data);
      result_items = {
        spltag: {
          item_keys: response?.items?.map((item) => item.item_key) ?? [],
        },
      };
      break;
    case 'attachment':
    default:
      response = await getAttachmentItemIdList(client, data);
      result_items = {
        attachment: {
          item_ids: response?.items?.map((item) => item.item_id) ?? [],
        },
      };
      break;
  }

  const result = {
    type: response?.type,
    status_code: response?.status_code,
    status_msg: response?.status_msg || '',
    approval: response?.approval,
    ...result_items,
  };

  /////////////////////////////
  // Response
  express_res.func(res, result);
};
module.exports.func = getWishes;
