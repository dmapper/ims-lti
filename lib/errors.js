var ConsumerError, NonceError, OutcomeResponseError, ParameterError, SignatureError, StoreError,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ConsumerError = (function(_super) {
  __extends(ConsumerError, _super);

  function ConsumerError(message) {
    this.message = message;
    ConsumerError.__super__.constructor.apply(this, arguments);
  }

  return ConsumerError;

})(Error);

StoreError = (function(_super) {
  __extends(StoreError, _super);

  function StoreError(message) {
    this.message = message;
    StoreError.__super__.constructor.apply(this, arguments);
  }

  return StoreError;

})(Error);

ParameterError = (function(_super) {
  __extends(ParameterError, _super);

  function ParameterError(message) {
    this.message = message;
    ParameterError.__super__.constructor.apply(this, arguments);
  }

  return ParameterError;

})(Error);

SignatureError = (function(_super) {
  __extends(SignatureError, _super);

  function SignatureError(message) {
    this.message = message;
    SignatureError.__super__.constructor.apply(this, arguments);
  }

  return SignatureError;

})(Error);

NonceError = (function(_super) {
  __extends(NonceError, _super);

  function NonceError(message) {
    this.message = message;
    NonceError.__super__.constructor.apply(this, arguments);
  }

  return NonceError;

})(Error);

OutcomeResponseError = (function(_super) {
  __extends(OutcomeResponseError, _super);

  function OutcomeResponseError(message) {
    this.message = message;
    OutcomeResponseError.__super__.constructor.apply(this, arguments);
  }

  return OutcomeResponseError;

})(Error);

module.exports = {
  ConsumerError: ConsumerError,
  StoreError: StoreError,
  ParameterError: ParameterError,
  SignatureError: SignatureError,
  NonceError: NonceError,
  OutcomeResponseError: OutcomeResponseError
};
