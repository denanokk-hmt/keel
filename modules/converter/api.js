'use strict'

const converter = (contents) => {
  switch (contents.output_format) {
    case 'watson_assistant' : 
    default :
      for (let idx in contents.convert_values) {
        //This object items forms are for watson_assistant modules output forms.
        contents.target_response.output.btalk.messages[idx].talk.content.message = contents.convert_values[idx].translation
      }
      break;
  }
  return contents.target_response
}
module.exports.func = converter