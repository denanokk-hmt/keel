'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//Watson
const credentials = conf.ai_credentials
const AssistantV1 = require('watson-developer-cloud/assistant/v1');
const aiInstance = (AssistantV1, watson) => {
  return new AssistantV1({
    username : watson.CONVERSATION_USERNAME,
    password : watson.CONVERSATION_PASSWORD,
    version : '2018-12-01',
    url : watson.URL
  });
}

let ai_instances = []
//Instance watson conversation
for(let i in credentials) {
  ai_instances.push(aiInstance(AssistantV1, credentials[i]))
};

module.exports.instances = ai_instances