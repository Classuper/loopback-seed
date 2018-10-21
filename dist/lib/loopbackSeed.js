'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loopbackFactory = require('./loopbackFactory');

var _loopbackFactory2 = _interopRequireDefault(_loopbackFactory);

var _faker = require('faker');

var _faker2 = _interopRequireDefault(_faker);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LoopbackSeed = function () {
  function LoopbackSeed(app, options) {
    _classCallCheck(this, LoopbackSeed);

    this.factory = [];
    this.app = app;
    if (options.fakerLocale) {
      _faker2.default.locale = options.fakerLocale;
    }
    this.datasource = options.datasource || 'db';
    if (!this.app.dataSources[this.datasource]) {
      throw new Error('You must have a valid datasource set for loopback seeder');
    }

    var root = app.root || process.cwd();
    var seedsDir = options.seedDir; // not currently working
    if (!seedsDir) {
      seedsDir = _path2.default.join(root, '/database');
    }
    if (!_fs2.default.existsSync(seedsDir)) {
      throw new Error('Can not find seeds path');
    }
    this.seedsDir = seedsDir;
  }

  _createClass(LoopbackSeed, [{
    key: 'createFactory',
    value: function createFactory(name, options) {
      this.factory.push(new _loopbackFactory2.default(name, options).toJSON());
    }
  }, {
    key: 'getFactory',
    value: function getFactory(name) {
      var factory = this.factory.find(function (key) {
        return key.name == name;
      });
      var factoryInstance = new _loopbackFactory2.default(factory.name, factory.options);
      return factoryInstance;
    }
  }, {
    key: 'migrateAll',
    value: function migrateAll() {
      var overrideEnv = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      var env = overrideEnv || process.env.NODE_ENV || 'default';
      require(this.seedsDir + '/factories');
      switch (env) {
        case 'default':
          require(this.seedsDir + '/seed.default');
          break;
        default:
          require(this.seedsDir + '/seed.' + env);
      }
    }
  }, {
    key: 'migrate',
    value: function migrate(factoryName) {
      var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function () {};

      var factory = this.getFactory(factoryName);
      var promises = [];
      for (var i = 0; i < size; i++) {
        var newModel = {};
        for (var property in factory.options) {
          if (factory.options[property] == null || typeof factory.options[property] == 'string' && factory.options[property].startsWith('{{')) {
            try {
              newModel[property] = _faker2.default.fake(factory.options[property]);
            } catch (err) {
              throw err;
            }
          } else {
            newModel[property] = factory.options[property];
          }
          if (options[property] !== undefined) {
            newModel[property] = options[property];
          }
        }
        callback(newModel);
        promises.push(this.createModel(factoryName, newModel));
      }
      return Promise.all(promises);
    }
  }, {
    key: 'createModel',
    value: function createModel(name, model) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.app.models[name].create(model, function (err, instance) {
          if (err) reject(err);
          console.log(instance);
          resolve(instance);
        });
      });
    }
  }, {
    key: 'reset',
    value: function reset(dsName) {
      var exit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var ds = this.app.dataSources[dsName];
      var tables = [];
      this.app.models().forEach(function (model) {
        var modelName = model.modelName;
        if (ds.name === model.dataSource.name) {
          tables.push(modelName);
        }
      });
      var query = " DROP SCHEMA public CASCADE; \
              CREATE SCHEMA public; \
              GRANT ALL ON SCHEMA public TO postgres; \
              GRANT ALL ON SCHEMA public TO public; \
              COMMENT ON SCHEMA public IS 'standard public schema';";

      return new Promise(function (resolve, reject) {
        ds.connector.execute(query, [], function (err, result) {
          ds.automigrate(tables, function (err) {
            if (err) reject(err);
            console.log('Loopback tables [' + tables + '] created in ', ds.adapter.name);
            if (exit) {
              ds.disconnect();
            }
            resolve();
          });
        });
      });
    }
  }, {
    key: 'end',
    value: function end(dsName) {
      var ds = this.app.dataSources[dsName];
      ds.disconnect();
    }
  }, {
    key: 'buildConstraints',
    value: function buildConstraints(dsName) {
      var ds = this.app.dataSources[dsName];
      console.log('building up the constraints');
      var queries = [];
      this.app.modelDefinitions.forEach(function (item) {
        if (item.config.dataSource == 'postgres') {
          var op1 = item.name;
          for (var key in item.definition.relations) {
            var ref = item.definition.relations[key];
            var type = ref.type;
            var op2 = ref.model;

            var dst = void 0,
                src = void 0;
            switch (type) {
              case 'hasMany':
              case 'hasOne':
                dst = ref.through === undefined ? op2 : ref.through;
                src = op1;
                break;
              case 'belongsTo':
                dst = op1;
                src = op2;
                break;
              default:
                throw error('NOT (yet) HANDLED constraint: ' + type);
            }

            var fk = ref.foreignKey === '' ? src + 'Id' : ref.foreignKey;
            var query = 'ALTER TABLE "' + dst.toLowerCase() + '" ADD CONSTRAINT ' + op1 + '_' + type + '_' + op2 + ' FOREIGN KEY (' + fk + ') REFERENCES "' + src.toLowerCase() + '"( id );';
            queries.push(query);
          };
        }
      });

      var promises = queries.map(function (x) {
        return new Promise(function (resolve, reject) {
          return ds.connector.execute(x, [], function (err, result) {
            if (err) {
              reject(err);
            }resolve(err);
          });
        });
      });
      return Promise.all(promises);
    }
  }]);

  return LoopbackSeed;
}();

exports.default = LoopbackSeed;