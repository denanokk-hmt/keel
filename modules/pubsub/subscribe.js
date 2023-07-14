'use strict';

const {PubSub} = require('@google-cloud/pubsub');

// Creates a client
const pubsub = new PubSub();

/**
 * Subscribe Messages
 * @param {*} subscriptionName
 * @param {*}  timeout = 60;
 */
const listenMessages = async (subscriptionName, timeout=60) => {

  // References an existing subscription
  const subscription = pubsub.subscription(subscriptionName);

  console.log(subscription)

  // Create an event handler to handle messages
  let messageCount = 0;
  const messageHandler = message => {
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    messageCount += 1;

    // "Ack" (acknowledge receipt of) the message
    message.ack();
  };

  // Listen for new messages until timeout is hit
  subscription.on(`message`, messageHandler);

  setTimeout(() => {
    subscription.removeListener('message', messageHandler);
    console.log(`${messageCount} message(s) received.`);
  }, timeout * 1000);

}
module.exports.listenMessages = listenMessages