'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status
const projectId = conf.google_prj_id;

//System
const {TranslationServiceClient} = require('@google-cloud/translate').v3beta1;

// Instantiates a client
const translationClient = new TranslationServiceClient();
const location  = 'global'; // 現在は"global"か"us-central1"のみ


/**
 * Translation
 * @param {str} talk_type
 * @param {Array or str} texts
 * @param {str} source_lang
 * @param {str} target_lang
 */
const taranslation = async ({talk_type, texts, source_lang='ja', target_lang='en'}) => {

  //Gard for init.
  if (talk_type == "init") return texts

  //Use case 
  // case : texts are strings in array --> after the getting the answer(Asker).
  // case : texts is string --> befor getting the answer(Asker).
  let results
  let text
  if (texts instanceof Array) {
    results = []
    for (let idx in texts) {
      text = texts[idx]
      results.push(await googleTranslationAPI({text, source_lang, target_lang}))
    }
  } else {
    text = texts
    results = await googleTranslationAPI({text, source_lang, target_lang})
  }
  return results
}
module.exports.func = taranslation

/**
 * Translation
 * @param {str} text
 * @param {str} sourceLang
 * @param {str} targetLang
 */
const googleTranslationAPI = async ({text, source_lang='ja', target_lang='en'}) => {
  // Construct request
  const request = {
    parent: translationClient.locationPath(projectId, location),
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: source_lang,
    targetLanguageCode: target_lang,
  };

  // Run request
  const [response] = await translationClient.translateText(request)
  .catch(err => {
    return {
      status_code : code.ERR_S_API_REQ_902,
      status_msg : status.ERR_S_API_REQ_902,
      approval : false,
      message: err.message,
      stack: err.stack,
    }
  })

  for (const translation of response.translations) {
    //console.log(`Translation: ${translation.translatedText}`);
    return {
      translation : translation.translatedText
    }
  }
}
module.exports.googleTranslationAPI = googleTranslationAPI