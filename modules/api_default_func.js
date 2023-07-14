//config
const conf = require(REQUIRE_PATH.configure);
const env = conf.env

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const crypto = moduler.crypto
const {getIP} = moduler.getIP


const apiDefaultFunc = {

  //End next
  Final : (req, res) => {
    try {
      console.log()
    } catch(err) {
      console.error(err)
    }
  },

  //Default Setting
  firstSet: (req, res, next) => {
    try {

      //Set logiD & customer_uuid
      if (req.method == 'GET') {
        req.logiD = req.query.logiD
        req.customer_uuid = req.query.customer_uuid
      } else {
        req.logiD = req.body.logiD
        req.customer_uuid = req.body.customer_uuid
      }

      if (!req.logiD) {
        //Create logiD
        req.logiD = `${crypto.seedRandom8()}${(new Date).getTime()}`
      }

      //Set client
      req.client = req.baseUrl.split("/")[2]

      //Set use
      let use = env.environment

      //Datastore namespace
      req.ns = `WhatYa-${req.client}-${use}`

      //API
      req.api = String(req.url.split('?')[0]).split('/').slice(1,).join('_').toUpperCase()

      //Get & set IP
      req.IP = getIP(req)

      //Mock
      req.mock = (req.method == 'GET')? req.query.mock : req.body.mock

      req.log = {
        url : req.url,
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
      }

      //body
      req.params = (req.method == 'GET')? req.query : (Object.keys(req.body).length)? req.body : req.query

      next()
    } catch(err) {
      console.error(err)
    }
  },

  //Logging request parameter
  loggingParams : (req, res, next) => {
    try {

      //Logging parameter
      console.log(`======${req.logiD} KEEL ${req.api}:`, JSON.stringify(req.params))

      //Logging header
      console.log(`======${req.logiD} KEEL HEADERS:`, JSON.stringify(req.headers))

      //IP
      console.log(`======${req.logiD} KEEL REQUEST IP:`, req.IP)

      next()
    } catch(err) {
      console.error(err)
    }
  },

};
module.exports = {
  apiDefaultFunc
};