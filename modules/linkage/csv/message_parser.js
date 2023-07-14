'use struct';

// Map Label to event data for WhatYa Events logging.
const eventLogMap = require('./eventlog_map').map

//Read CSV
const parseData = (spreadsheet, header) => {
  return arranger2(spreadsheet, header)
}
module.exports.parseData = parseData

/**
 * Make for Bwing type response Array
 * No Associative array(slider, chip) Base arrangement 
 * @param {*} data 
 */
function arranger2(data, header) {
  const default_column_type_pos = 1 //csvデータのtypeのカラム位置 
  const default_column_msg_pos = 2 //csvデータのmessageのカラム位置 
  const default_column_qty = 3 //csvデータの必須カラム, 
  const default_column_name_pos = 3 //csvデータのカラム名の位置
  const value_column_pos = default_column_qty + 1 //csvデータの入力値の開始位置
  const youtube_re_long = new RegExp(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=(?<id>[^&]+)/)  // YouTubeのアドレス
  const youtube_re_short = new RegExp(/^https?:\/\/youtu\.be\/(?<id>.*)/) // YouTubeの短縮アドレス
  let column
  let sliders
  let resMsg
  let resArry = []
  let additional_header_index

  // Re-construct data for additional headers
  if (header && header[0] == "response_no") {
    additional_header_index = header.indexOf("eventlog")
    console.log(`=====Additional Reponse meta enabled (index: ${additional_header_index})`)
    if (additional_header_index < 0) { additional_header_index = null }
  }

  // Generic method for multicolumn message type, e.g. sliders, chips.
  const multicolumn_response = (i, items_limit, default_column_msg_pos_value, propname) => {
    column = data[i][default_column_name_pos].replace(/\r?\n/g, ',').split(',')
    let items = []
    for (let y = value_column_pos; y < items_limit; y++ ) {          
      let values = data[i][y].replace(/\r?\n/g, '|').split('|')
      let val = {}
      if (column.length == values.length) {
        for (let z in column) {
          val[column[z]] = values[z]
        }
        items.push(val)
      }
    }
    let resMsg = {
      type : data[i][default_column_type_pos],
      content : {
        message : default_column_msg_pos_value.replace(/\r?\n/g, '\\n'),
      }
    }
    resMsg.content[propname] = items
    return resMsg
  }
  
  for(let i in data) {

    let default_column_msg_pos_value = (data[i][default_column_msg_pos])? data[i][default_column_msg_pos] : ''
    resMsg = {}

    // Don't overtake additional headers.
    let items_limit
    if (additional_header_index && additional_header_index < data[i].length) {
      items_limit = additional_header_index
    } else {
      items_limit = data[i].length
    }

    switch (data[i][default_column_type_pos]) {
      case 'text' :
      case 'takeover_to_op' :
      case 'coupon' :
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: default_column_msg_pos_value.replace(/\r?\n/g, '\\n'),
          },
        }
        break;
      case 'req_login':
        let req_login_url
        let req_login_query = {}
        let req_login_headercolumn = data[i][default_column_name_pos].replace(/\r?\n/g, '\n').split('\n')
        let req_login_values = data[i][value_column_pos].replace(/\r?\n/g, '\n').split('\n')
        for (let ix=0; ix < req_login_headercolumn.length; ix++) {
          if (req_login_headercolumn[ix] == "url") {
            req_login_url = req_login_values[ix]
          } else {
            req_login_query[req_login_headercolumn[ix]] = req_login_values[ix]
          }
        }
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: default_column_msg_pos_value.replace(/\r?\n/g, '\\n'),
            url: req_login_url,
            query: req_login_query
          },
        }
        break
      case 'markdown' :
        let msg = default_column_msg_pos_value.replace(/###/g, data[i][3])
        msg = msg.replace(/&&&/g, data[i][4])
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : msg,
          }
        }
        break;
      case 'telephone' :
      case 'mail' :
      case 'own_coupon_slider' :
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : default_column_msg_pos_value,
            value : data[i][default_column_qty],
          }
        }
        break;
      case 'image' :
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : default_column_msg_pos_value.replace(/\r?\n/g, '\\n'),
            img_url : data[i][default_column_qty],
            alt : data[i][value_column_pos],
          }
        }
        break;
      case 'string_string_slider' :
      case 'string_value_slider' :
      case 'string_image_slider' :
      case 'item_image_slider' :
      case 'link_image_slider' :
      case 'coupon_slider' :
      case 'locked_coupon_slider' :
        resMsg = multicolumn_response(i, items_limit, default_column_msg_pos_value, "sliders")
        break;
      case 'youtube_slider':
        column = data[i][default_column_name_pos].replace(/\r?\n/g, ',').split(',')
        sliders = []
        for (let y = value_column_pos; y < items_limit; y++ ) {          
          let values = data[i][y].replace(/\r?\n/g, '|').split('|')
          let val = {}
          if (column.length == values.length) {
            for (let z in column) {
              if (column[z] == "youtube_id") {
                let match = values[z].match(youtube_re_long)
                if (!match) { match = values[z].match(youtube_re_short) }
                if (match && match.groups) {
                  val["img_url"] = `https://img.youtube.com/vi/${match.groups.id}/mqdefault.jpg` // hqdefault?
                } else {
                  val["img_url"] = `https://img.youtube.com/vi/${values[z]}/mqdefault.jpg`
                }
              } else {
                val[column[z]] = values[z]
              }
            }
            sliders.push(val)
          }
        }
        resMsg = {
          type : 'item_image_slider', // Convert to item_image_slider
          content : {
            message : default_column_msg_pos_value.replace(/\r?\n/g, '\\n'),
            sliders,
          },
        }
        break;
      case 'string_string_chip' :
      case 'string_value_chip' :
      case 'string_avatar_chip' :
      case 'list' :
      case 'survey':
      case 'analysis':
        resMsg = multicolumn_response(i, items_limit, default_column_msg_pos_value, "chips")
        break;
      case 'dialog':
        let messages = default_column_msg_pos_value.replace(/message:/, '|').replace(/chip_accept:/, '|').replace(/chip_deny:/, '|').split("|")
        const message = messages[1].replace(/\r?\n/g, '\\n').replace(/(.*)\\n/g, '$1')
        const chip_accept = messages[2].replace(/\r?\n/g, '')
        const chip_deny = messages[3].replace(/\r?\n/g, '')
        let dialog_items = []
        let item_value ={}
        let dialog_values = []
        let z = -1

        let dialog_keys = []
        for (let y = value_column_pos; y < items_limit; y++ ) {          
          let values = data[i][y].replace(/\r?\n/g, '|').split('|')
          if (values[0].match("type:")) {
            z++
            dialog_values = []
            dialog_keys[0] = values[0].replace(/type:/, '')
            dialog_keys[1] = values[1].replace(/label:/, '')
            dialog_keys[2] = values[2].replace(/key:/, '')
          } else {
            if (values[1] && values[2]) {
              dialog_values.push({
                item_name : values[1],
                item_value : values[2],
              })
            }
          }
          //everytime rewrite item values
          item_value = {
            type : dialog_keys[0],
            label : dialog_keys[1],
            key : dialog_keys[2],
            values : dialog_values,
          }
          dialog_items[z] = item_value
        }

        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message,
            chip_accept,
            chip_deny,
            dialog_items,
          },
        }
        break;
      case 'image_card' :
        const values = data[i][value_column_pos].replace(/\r?\n/g, '|').split('|')
        resMsg = {
          type : data[i][default_column_type_pos],
          content : {
            message : default_column_msg_pos_value,
            image: values[0],
            text : data[i][5].replace(/\r?\n/g, '\\n'),
            link: {
              label:values[1],
              url:values[2],
            }
          }
        }
        break;
      case 'youtube':
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            videoId: data[i][3], // Youtube動画のID
            autoplay: Boolean(data[i][4]), // 自動再生するかのフラグ. モバイルでは無視される
            invokeEnded: Boolean(data[i][5]), // 動画再生終了時にInvokeするかのフラグ
          },
        }
        break;
      case 'analysis_result':
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            analysis_id: data[i][default_column_msg_pos+1],   // 診断ID
            analysis_name: data[i][default_column_msg_pos+2], // 診断タイトル
          },
        }
        break;
      case 'attachment':
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: data[i][default_column_msg_pos].replace(/\r?\n/g, '\\n'),
            type:    data[i][default_column_msg_pos+1],  // Attachment type
            tags:    String(data[i][default_column_msg_pos+2] || "").replace(/\r?\n/g, '|').split('|').filter(s => !!s),  // Attachment Tags（改行区切りで複数設定）
            force:   Boolean(data[i][default_column_msg_pos+3]), // Attachment強制表示フラグ
          },
        }
        break;
      case 'command' :
        resMsg = {
          type: data[i][default_column_type_pos],
          content: {
            message: default_column_msg_pos_value.replace(/\r?\n/g, '\\n'),
          },
        }
        if (resMsg?.content?.message === "attachment" || resMsg?.content?.message === "spltag") {
          const cmdKey = resMsg?.content?.message
          resMsg.content[cmdKey] = {
            message: data[i][default_column_msg_pos+1].replace(/\r?\n/g, '\\n'),   // Attachment/Spltag message
            type:    data[i][default_column_msg_pos+2],    // Attachment/Spltag type
            tags:    String(data[i][default_column_msg_pos+3] || "").replace(/\r?\n/g, '|').split('|').filter(s => !!s),  // Attachment/Spltag Tags（改行区切りで複数設定）
            force:   Boolean(data[i][default_column_msg_pos+4]), // Attachment/Spltag強制表示フラグ
          }
          if (data[i][default_column_msg_pos+5]) {
            const filters = convertAttachmentFilters(data[i][default_column_msg_pos+5])
            if (filters) {
              resMsg.content[cmdKey].filters = filters
            }
          }
        }
        break;

      default:
        break;
    }
    // Compiling additional meta.
    if (additional_header_index && resMsg.type) {
      /*
        metaindex       : eventLog
      */
      if (data[i][additional_header_index]) {
        resMsg.eventLog = eventLogMap[data[i][additional_header_index]]
        if (resMsg.eventLog) { 
          resMsg.eventLog.label = data[i][additional_header_index]
          resMsg.eventLog.type = "event" // Unconditionally keel returns "type" as a "event".
        } 
      }
    }

    //Set bot talking for response set
    resArry[ data[i][0] ] = resMsg;
  }
  return resArry
}

/**
 * \n replace to \\n
 * @param {*} value
 */
const ope = {
  eq: {
    splitter: '=', reg: /[^!><][=]/,
  },
  ne: {
    splitter: '!=', reg: /[!][=]/,
  },
  lt: {
    splitter: '<', reg: /[<][^=]/,
  },
  gt: {
    splitter: '>', reg: /[>][^=]/,
  },
  le: {
    splitter: '<=', reg: /[<][=]/,
  },
  ge: {
    splitter: '>=', reg: /[>][=]/,
  },
}
function convertAttachmentFilters(value) {
  if (!value) { return null }
  const strs = value.replace(/\r?\n/g, '|').split('|')
  const filters = []
  for (let str of strs) {
    const v = str.replace(/[\s]/g, '')
    for (let k of Object.keys(ope)) {
      const op = ope[k]
      if (op.reg.test(v)) {
        const vals = v.split(op.splitter)
        if (vals?.length >= 2) {
          filters.push({
            name: vals[0],
            ope: k,
            value: vals[1]
          })
          break
        }
      }
    }
  }
  if (!filters?.length) { return null }
  return filters
}

/**
 * \n replace to \\n 
 * @param {*} data 
 */
function replaceN(data) {
  let resMsg
  let resArry = []
  for(let i in data) {
    let res = []
    resMsg = data[i][1].replace(/\r?\n/g, '\\n')
    resArry[ data[i][0] ] = resMsg;
  }
  return resArry
}