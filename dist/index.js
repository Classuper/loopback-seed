'use strict';

var _loopbackSeed = require('./lib/loopbackSeed');

var _loopbackSeed2 = _interopRequireDefault(_loopbackSeed);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (app, options) {
  var seeder = new _loopbackSeed2.default(app, options);
  app.seeder = seeder;
};