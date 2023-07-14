'use strict';

const {PubSub} = require('@google-cloud/pubsub');

// Creates a client
const pubsub = new PubSub();

/**
 * Publish Messages
 * Need response return status_code, answer(contents of response)
 * @param {text} topicName
 * @param {*} data = JSON.stringify({ foo: 'bar' });
 * @param {text} orderingKey
 */
const publishMessage = async (topicName, data, orderingKey='default_key') => {
  const dataBuffer = Buffer.from(data);
  const message = {
    data: dataBuffer,
    orderingKey: orderingKey,
  };
  return await pubsub.topic(topicName, {enableMessageOrdering: true})
  .publishMessage(message)
  .then(result => {
    console.log(`Message ${result} published.`);
    return result
  })
  .catch(err => {
    throw new Error(err)
  })
}
module.exports.publishMessage = publishMessage;
