'use strict';

const sexCodeToStr = (code) => {
  switch (code) {
    case 1: return "Male"
    case 2: return "Female"
  }
  return null
}
const materialsToObj = (materials) => {
  return (materials || []).reduce((res, m) => {
    let ary = m.Material.split(':')
    let key = ary.shift()
    if (key) {
      res[key] = ary.join(':')
    }
    return res
  }, {})
}
const imagesToArray = (images) => {
  return (images || []).reduce((res, img) => {
    if (img?.Url) {
      res.push(img.Url)
    }
    return res
  }, [])
}
const detailsToObj = (details) => {
  return (details || []).reduce((res, d) => {
    let ary = d.Value.split(':')
    let key = ary.shift()
    if (key) {
      res[key] = ary.join(':')
    }
    return res
  }, {})
}

const convertItem = (base, item) => {
  return {
    ...base,
    type:           'attachment',
    id:             item?.ItemId || null,
    name:           item?.ItemTitle || null,
    url:            item?.ItemSiteUrl || null,
    image_url:      item?.ImageMainUrls[0]?.Url || null,
    overview:       "",
    description:    (item?.ItemDescriptionDetail + item?.ItemDescriptionDetail2) || null,
    category_large: item?.CodeCategoryNameLarge || null,
    category_small: item?.CodeCategoryNameSmall || null,
    category_code_L: item?.ItemCategoryCodeL || null,
    category_code_S: item?.ItemCategoryCodeS || null,
    brand_name:     item?.CodeBrandName || null,
    brand_code:     item?.ItemBrandCode || null,
    order:          item?.ItemOrderWeight || null,
    depth:          item?.Depth || null,
    frequency:      item?.Frequency || null,
    sku_id:         item?.Image1stSkuId || null,
    price:          item?.SkuPrice || null,
    sex:            sexCodeToStr(item?.ItemSex),
    sub_image_urls: imagesToArray(item?.ImageSubUrls),
    materials:      materialsToObj(item?.ItemMaterials),
    catch_copy:     item?.ItemCatchCopy || null,
    release_date:   item?.ItemReleaseDate || null,
    release_unixtime: item?.ItemReleaseDateUnixTime || 0,
    words:          item?.ItemWords || [],
  }
}
const convertSku = (base, item) => {
  return {
    ...base,
    id:             item?.SkuId || null,
    item_id:        item?.ItemId || null,
    sub_image_urls: imagesToArray(item?.ImageSubUrls),
    details:        detailsToObj(item?.SkuDetails),
    price:          item?.SkuPrice || null,
    stock:          item?.SkuStockQty || null,
  }
}
const convertSpltagItem = (base, item) => {
  return {
    ...base,
    type:           item?.AttachmentItemRef ? 'attachment' : 'spltag',
    id:             item?.AttachmentItemRef || null,
    word:           item?.TagsWord || null,
    name:           item?.ItemTitle || null,
    url:            item?.ItemSiteUrl || null,
    image_url:      item?.ImageMainUrls[0]?.Url || null,
    description:    (item?.ItemDescriptionDetail + item?.ItemDescriptionDetail2) || null,
    order:          item?.ItemOrder || null,
    price:          item?.SkuPrice || null,
    sub_image_urls: imagesToArray(item?.ImageSubUrls),
    tag_id:         item?.TagID || null,
    item_key:       item?.ItemKey || null,
  }
}
module.exports = {
  convertItem: convertItem,
  convertSku: convertSku,
  convertSpltagItem: convertSpltagItem,
}