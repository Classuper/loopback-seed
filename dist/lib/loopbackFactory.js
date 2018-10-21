"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LoopbackFactory = function () {
  function LoopbackFactory(name, options) {
    _classCallCheck(this, LoopbackFactory);

    this.name = name;
    this.options = options;
  }

  _createClass(LoopbackFactory, [{
    key: "toJSON",
    value: function toJSON() {
      return {
        name: this.name,
        options: this.options
      };
    }
  }]);

  return LoopbackFactory;
}();

exports.default = LoopbackFactory;