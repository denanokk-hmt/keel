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
 * Post Attachment Search to TagCar
 * @param {*} req 
 * @param {*} res
 * @param {*} params
 */
const postAttachmentSearch = async (req, res, params) => {

  const logiD = req.logiD
  console.log(`=========${logiD} POST ATTACHMENT SEARCH===========`)

  //Set client
  const client = req.client

  //Set namespace
  const ns = req.ns

  const query = params.query || {}
  if (!query.type || !query.tags) {
    throw new Error("Invalid query.")
  }
  query.filters = query.filters || []

  const chained_tags = params.chained_tags || {}
  // if (!chained_tags.ATID
  //   || !chained_tags.DDID
  //   || !chained_tags.unixtime
  //   || !chained_tags.related_words_log
  // ) {
  //   throw new Error("Invalid chained_tags.")
  // }

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
  const url = `https://${conf.domains_tugcar[client]}/${conf.env.routes.url_api}/attachment/search/Items`
  const response = await postRequest('POST', url, data, )
  .catch(err => {
    console.log(`${logiD} api fail - url:${url}, data:${JSON.stringify(data)}`)
    throw err
  })
  const apiTime = (new Date().getTime()) - stTime
  console.log('api ms', apiTime)

  const resItems = response?.data?.Items || []
  const firstItem = response?.data?.SearchItems || {}

  //--------------------------
  // ソート情報取得
  // ソート情報：Object配列形式（key:Tugcar側のプロパティ名, value:asc/desc/auto, type:undefined/number/string）
  // asc:昇順、desc:降順、auto:１番目のデータの値を先頭に以降はasc
  // type: undefined/number: 数値としてソート、string: 文字列としてソート
  // ※CTに設定がある場合はその値を使用し、ない場合には以下のデフォルト値を使用する。
  const default_sort = [
    { key: 'ItemSex', value: 'auto' },
    { key: 'ItemCategoryCodeLSearchCalc', value: 'asc' },
    { key: 'ItemCategoryCodeSSearchCalc', value: 'asc' },
    { key: 'Depth', value: 'asc' },
    { key: 'Frequency', value: 'desc' },
  ]
  const sort = [...(conf.attachment[client]?.sort || default_sort)]

  const divideItems = (items, basis, key, sort) => {
    // ItemSexかつdescの場合の特別対応（その他を末尾に移動（2,1,3））
    const exceptionForItemSex = (key === 'ItemSex' && sort === 'desc')

    // autoでない、または特別対応がない場合は分割しない
    if (sort !== 'auto' && !exceptionForItemSex) {
      return [[], [...items], false]
    }

    let targetVal = basis[key]
    if (exceptionForItemSex) {
      // ItemSexかつdescの場合の特別対応
      targetVal = 3
    }
    // autoの場合のみ対象のデータを分割する
    return items.reduce((res, item) => {
      let index = item[key] === targetVal ? 0 : 1
      res[index].push(item)
      return res
    }, [[],[], exceptionForItemSex])    
  }
  const sortItems = (items, basis, key, sort, type) => {
    // ソート対象とそれ以外を分ける
    // ※reverse=falseの場合はそれ以外を先頭へ、trueの場合はそれ以外を末尾に
    const [target, sorting, reverse] = divideItems(items, basis, key, sort)

    const num = sort === 'desc' ? -1 : 1  // asc,auto=1, desc=-1
    switch (type) {
      case 'string':
        sorting.sort((a, b) => {
          let val = 0
          if (a[key] < b[key]){ val = -1 }
          else if (a[key] > b[key]){ val = 1 }
          return num * val
        })
        break
      case 'number':
      default:  // defaultは数値としてソート
        sorting.sort((a, b) => num * (a[key] - b[key]))
        break
    }
    
    return reverse ? sorting.concat(target) : target.concat(sorting)
  }
  stTime = new Date().getTime()
  let items = resItems
  for (let s of sort.reverse()) {   // 登録されるソート順は上が上位のため、ソート処理は逆順で行う
    let key   = s.key
    let value = s.value
    let type = s.type || null
    if (!key || !value) { continue }
    items = sortItems(items, firstItem, key, value, type)
  }

  if (items.length) {
    const firstItemId = firstItem.ItemId
    if (items.find(item => item.ItemId === firstItemId)) {
      // Itemsに指定アイテムが含まれる場合、
      // 先頭が指定したIDでない場合、先頭にもってくる
      if (items[0].ItemId !== firstItemId) {
        items = items.reduce((res, item) => {
          if (item.ItemId === firstItemId) {
            res.unshift(item)
          } else {
            res.push(item)
          }
          return res
        }, [])
      }
    } else {
      // Itemsに指定アイテムが含まれない場合、指定アイテムを先頭に追加
      items.unshift(firstItem)
    }
  }
  const sortTime = (new Date().getTime()) - stTime
  console.log('sort ms', sortTime)

  const result = {
    attachments: {
      query: data.query,
      items: items.map((item, i) => {
        return attachment.convertItem({qry_result_no: i+1}, item)
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
      Items:(response.data?.Items || []).map(o => { return {
        Revision: o.Revision,
        ItemId: o.ItemId,
        Depth: o.Depth,
        Frequency: o.Frequency,
      }}),
      SearchItems: response.data?.SearchItems,
    },
    sort,
    result: {
      query: result.attachments?.query,
      Items: (result.attachments?.items || []).map(o => { return {
        id: o.id,
        depth: o.depth,
        frequency: o.frequency,
      }}),
    },
    time: {
      api: apiTime,
      sort: sortTime,
    }
  }
  const text = `type:Items|client:${client}|logiD:${logiD}|url:${url}|customer_uuid:${customer_uuid}|hmt_id:${hmt_id}`

  //Combine log
  const output = {
    type : `[ATTACHMENT]`,
    json : json,
    text : text,
  }

  //Logging
  logger.systemJSON("ATTACHMENT", output, conf.env.log_stdout, false);
};
module.exports.func = postAttachmentSearch;