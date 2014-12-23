var exports;

exports = module.exports = {
  version: '0.0.0',
  Provider: require('./provider'),
  Consumer: require('./consumer'),
  OutcomeService: require('./outcome-service'),
  Errors: require('./errors'),
  Stores: {
    RedisStore: require('./redis-nonce-store'),
    MemoryStore: require('./memory-nonce-store'),
    NonceStore: require('./nonce-store')
  },
  supported_versions: ['LTI-1p0']
};
