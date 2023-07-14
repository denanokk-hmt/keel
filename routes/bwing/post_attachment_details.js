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
 * Post Attachment Details to TagCar
 * @param {*} req 
 * @param {*} res
 * @param {*} params
 */
const postAttachmentDetails = async (req, res, params) => {

  const logiD = req.logiD
  console.log(`=========${logiD} POST ATTACHMENT DETAILS===========`)

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns

  const query = params.query || {}
  if (!query.item_id) {
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
  const url = `https://${conf.domains_tugcar[client]}/${conf.env.routes.url_api}/attachment/search/Sku`
  const response = await postRequest('POST', url, data, )
  .catch(err => {
    console.log(`${logiD} api fail - url:${url}, data:${JSON.stringify(data)}`)
    throw err
  })
  const apiTime = (new Date().getTime()) - stTime
  console.log('api ms', apiTime)

  const result = {
    attachments: {
      query: data.query,
      items: (response?.data?.Sku || []).map((item, i) => {
        return attachment.convertSku({qry_result_no: i+1}, item)
      })
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
      Items:(response.data?.Sku || []).map(o => { return {
        Revision: o.Revision,
        ItemId: o.ItemId,
        SkuId: o.SkuId,
      }}),
    },
    result: {
      query: result.attachments?.query,
      Items: (result.attachments?.items || []).map(o => { return {
        id: o.id,
        item_id: o.item_id,
      }}),
    },
    time: {
      api: apiTime,
    }
  }
  const text = `type:Sku|client:${client}|logiD:${logiD}|url:${url}|customer_uuid:${customer_uuid}|hmt_id:${hmt_id}`

  //Combine log
  const output = {
    type : `[ATTACHMENT]`,
    json : json,
    text : text,
  }

  //Logging
  logger.systemJSON("ATTACHMENT", output, conf.env.log_stdout, false);
};
module.exports.func = postAttachmentDetails;