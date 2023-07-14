'use strict';

// config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code;
const Promise = require('bluebird');

// express
const express_res = conf.express_res;

// moduler
const moduler = require(REQUIRE_PATH.moduler);

// System modules
const { postRequest, getRequest } = moduler.http;

const attachment = require(`${REQUIRE_PATH.modules}/attachment`);

/**
 * Post request to Wish server to fetch Attachment items
 *
 * @param {Object} params
 * @param {string} params.logiD
 * @param {string} params.client_id
 * @param {string} params.customer_uuid
 * @param {string} params.hmt_id
 * @returns Wish Attachment Items list
 */
const postWishGetAttachmentItems = async (params) => {
  const log_id = params.logiD;
  const client = params.client_id;

  // Post Request: get AttachmentItem ID list from Wish Server
  const wish_URL = `https://${conf.domains_wish[client]}/${conf.env.routes.url_api}/${client}/get/attachment/items`;
  const wish_response = await getRequest(wish_URL, params)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${log_id} Wish API fail - url:${wish_URL}, data:${JSON.stringify(params)}`);
      throw err;
    });

  if (!wish_response?.items || wish_response.items.length === 0) {
    return [];
  }

  /////////////////////////////
  const params_tugcar = {
    ...params,
    query: {
      item_ids: wish_response.items.map((item) => item.item_id),
    },
  };
  // POST Request: fetch Attachment Items from TugCar
  const tugcar_URL = `https://${conf.domains_tugcar[client]}/${conf.env.routes.url_api}/attachment/get/Items`;
  const tugcar_response = await postRequest('POST', tugcar_URL, params_tugcar)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${log_id} TugCar API fail - url:${tugcar_URL}, data:${JSON.stringify(data)}`);
      throw err;
    });

  const attachment_details = tugcar_response?.Items || [];
  const sortItems = (items, sortBase) => {
    // Item ID list ordered by udt desc
    const orderedIds = sortBase.slice().sort((a, b) => new Date(b.udt) - new Date(a.udt));
    // Item list ordered by previous Item ID list
    return orderedIds.map((order) => items.find((a) => a.ItemId === order.item_id));
  };
  const sorted_attachment_details = sortItems(attachment_details, wish_response.items);
  return sorted_attachment_details;
};

/**
 * Post request to Wish server to fetch SpecialTag items
 *
 * @param {Object} params
 * @param {string} params.logiD
 * @param {string} params.client_id
 * @param {string} params.customer_uuid
 * @param {string} params.hmt_id
 * @returns Wish SpecialTag Items list
 */
const postWishGetSpecialTagItems = async (params) => {
  const log_id = params.logiD;
  const client = params.client_id;

  // Post Request: get AttachmentItem ID list from Wish Server
  const wish_URL = `https://${conf.domains_wish[client]}/${conf.env.routes.url_api}/${client}/get/specialtag/items`;
  const wish_response = await getRequest(wish_URL, params)
    .then((response) => response.data)
    .catch((err) => {
      console.log(`${log_id} Wish API fail - url:${wish_URL}, data:${JSON.stringify(params)}`);
      throw err;
    });

  if (!wish_response?.items || wish_response.items.length === 0) {
    return [];
  }

  /////////////////////////////
  const tugcar_params = {
    ...params,
    query: {
      item_ids: wish_response.items.map((item) => `${item.item_key}_${item.tag_id}`),
    },
  };
  const tugcar_URL = `https://${conf.domains_tugcar[client]}/${conf.env.routes.url_api}/attachment/get/SpecialTagItems`;

  // POST Request: fetch Attachment Items from TugCar
  const specialtag_details = await postRequest('POST', tugcar_URL, tugcar_params)
    .then((response) => {
      const items = [];
      for (let index = 0; index < response.data?.SpecialTagItems?.length; index++) {
        const item = response.data.SpecialTagItems[index];
        // Add Key to item
        item.ItemKey = response.data.Requests[index]?.IDKey;
        item.TagsWord = item.ItemWords?.[0] || null;
        items.push(item);
      }
      return items;
    })
    .catch((err) => {
      console.log(`${log_id} TugCar API fail - url:${tugcar_URL}, data:${JSON.stringify(params)}`);
      throw err;
    });

  const sortItems = (items, sortBase) => {
    // Item ID list ordered by udt desc
    const orderedIds = sortBase.slice().sort((a, b) => new Date(b.udt) - new Date(a.udt));
    // Item list ordered by previous Item Key list
    return orderedIds.map((order) => items.find((a) => a.ItemKey === order.item_key));
  };
  const sorted_specialtag_details = sortItems(specialtag_details, wish_response.items);
  return sorted_specialtag_details;
};

/**
 * Post Attachment Search to TugCar
 * @param {*} req
 * @param {*} res
 * @param {*} params
 */
const postWishGetDetails = async (req, res, params) => {
  const log_id = req.logiD;
  console.log(`=========${log_id} POST WISH ATTACHMENT ITEMS ===========`);

  const baseParams = {
    logiD: log_id,
    version: params.version,
    client_id: req.client,
    current_url: params.current_url,
    current_params: params.current_params,
    customer_uuid: params.customer_uuid || null,
    hmt_id: params.hmt_id || null,
  };

  const [attachment_items, specialtag_items] = await new Promise.all([
    postWishGetAttachmentItems(baseParams),
    postWishGetSpecialTagItems(baseParams),
  ]);

  const result = {
    attachment: {
      item_ids: attachment_items.map((item) => item.ItemId) ?? [],
      items: attachment_items.map((item, i) => attachment.convertItem({ qry_result_no: i + 1 }, item)),
    },
    spltag: {
      item_keys: specialtag_items.map((item) => item.ItemKey) ?? [],
      items: specialtag_items.map((item, i) => attachment.convertSpltagItem({ qry_result_no: i + 1 }, item)),
    },
  };

  /////////////////////////////
  //Response
  express_res.func(res, result);
};
module.exports.func = postWishGetDetails;
