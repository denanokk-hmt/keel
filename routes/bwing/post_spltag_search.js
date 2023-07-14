'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)
const logger = require(`${REQUIRE_PATH.modules}/log`);

//System modules
const {postRequest} = moduler.http

const attachment = require(`${REQUIRE_PATH.modules}/attachment`)

/**
 * Post spltag Search to TagCar
 * @param {*} req 
 * @param {*} res
 * @param {*} params
 */
const postSpltagSearch = async (req, res, params) => {

  const logiD = req.logiD
  console.log(`=========${logiD} POST SPLTAG SEARCH===========`)

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns

  const query = params.query || {}
  if (!query.tags) {
    throw new Error("Invalid query.")
  }
  const chained_tags = params.chained_tags || {}

  const customer_uuid = params.customer_uuid || null
  const hmt_id    = params.hmt_id || null

  const data = {
    client_id: client,
    query: query,
    chained_tags: chained_tags,
    current_url: params.current_url,
    current_params: params.current_params,
    customer_uuid: customer_uuid,
    hmt_id:    hmt_id,
  }
  /////////////////////////////
  //Post Attachment Search to TagCar
  let stTime = new Date().getTime()
  const url = `https://${conf.domains_tugcar[client]}/${conf.env.routes.url_api}/attachment/search/SpecialTag`
  const response = await postRequest('POST', url, data, )
  .catch(err => {
    console.log(`${logiD} api fail - url:${url}, data:${JSON.stringify(data)}`)
    throw err
  })
  const apiTime = (new Date().getTime()) - stTime
  console.log('api ms', apiTime)

  let index = 0;
  const childItems = response?.data?.ChildSpecialTagItems || [];

  const tmp = (query.tags || []).reduce((ary, tagWord) => {
    const tags = childItems.filter(o => o.Requests?.TagsWord === tagWord);
    if (!tags?.length) { return ary; }
    for (let tag of tags) {
      if (!tag?.SpecialTagItems?.length) { continue; }
      let index_item_key = 0;
      for (let tagItem of tag.SpecialTagItems) {
        // add Datastore key to SpecialTagItem
        tagItem.ItemKey = tag.SpecialTagItemsKeys[index_item_key] || null;
        index_item_key++;
        
        ary.push(attachment.convertSpltagItem({ qry_result_no: index+1 }, {
          ...tagItem,
          TagsWord: tagWord,
        }));
        index++;
      }
    }
    return ary;
  }, []);
  const sorted = tmp.sort((a, b) => {
    let val_a = a.order || 0
    let val_b = b.order || 0
    return (val_a < val_b) ? -1 : 1;
  });
  const items = sorted.map((item, i) => {
    item.qry_result_no = i + 1;
    return item;
  });
  const result = {
    spltags: {
      query: data.query,
      items: items,
    }
  }

  /////////////////////////////
  //Response
  express_res.func(res, result)

  //JSON payload log
  const json = {
    ...data,
    response: {
      status:     response.status,
      statusText: response.statusText,
      Items: response.data?.SpecialTagItems || [],
      SearchItems: response.data?.SearchItems,
    },
    result: {
      query: result.spltags?.query,
      Items: result.spltags?.items,
    },
    time: {
      api: apiTime,
    }
  }
  const text = `type:Items|client:${client}|logiD:${logiD}|url:${url}|customer_uuid:${customer_uuid}|hmt_id:${hmt_id}`

  //Combine log
  const output = {
    type : `[SPLTAG]`,
    json : json,
    text : text,
  }

  //Logging
  logger.systemJSON("SPLTAG", output, conf.env.log_stdout, false);
};
module.exports.func = postSpltagSearch;