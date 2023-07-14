'use strict';

const parser = require('./parser');
module.exports.parser = parser;

const preModule = require('./talk');
module.exports.treatMessages = preModule.treatMessages;

const resContextModule = require('./res_context');
module.exports.getResContext = resContextModule.getResContext;

const postModule = require('./response');
module.exports.modifyMessages = postModule.modifyMessages;

const validator = require('./validator');
module.exports.validator = validator;