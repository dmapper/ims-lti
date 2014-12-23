var OutcomeDocument, OutcomeService, crypto, errors, http, https, navigateXml, url, uuid, xml2js, xml_builder;

crypto = require('crypto');

http = require('http');

https = require('https');

url = require('url');

uuid = require('node-uuid');

xml2js = require('xml2js');

xml_builder = require('xmlbuilder');

errors = require('./errors');

navigateXml = (function(_this) {
  return function(xmlObject, path) {
    var part, _i, _len, _ref, _ref1;
    _ref = path.split('.');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      part = _ref[_i];
      xmlObject = xmlObject != null ? (_ref1 = xmlObject[part]) != null ? _ref1[0] : void 0 : void 0;
    }
    return xmlObject;
  };
})(this);

OutcomeDocument = (function() {
  function OutcomeDocument(type, source_did) {
    var xmldec;
    xmldec = {
      version: '1.0',
      encoding: 'UTF-8'
    };
    this.doc = xml_builder.create('imsx_POXEnvelopeRequest', xmldec);
    this.doc.attribute('xmlns', 'http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0');
    this.head = this.doc.ele('imsx_POXHeader').ele('imsx_POXRequestHeaderInfo');
    this.body = this.doc.ele('imsx_POXBody').ele(type + 'Request').ele('resultRecord');
    this.head.ele('imsx_version', 'V1.0');
    this.head.ele('imsx_messageIdentifier', uuid.v1());
    this.body.ele('sourceGUID').ele('sourcedId', source_did);
  }

  OutcomeDocument.prototype.add_score = function(score, language) {
    var eScore;
    if (typeof score !== 'number' || score < 0 || score > 1.0) {
      throw new errors.ParameterError('Score must be a floating point number >= 0 and <= 1');
    }
    eScore = this.body.ele('result').ele('resultScore');
    eScore.ele('language', language);
    return eScore.ele('textString', score);
  };

  OutcomeDocument.prototype.finalize = function() {
    return this.doc.end({
      pretty: true
    });
  };

  return OutcomeDocument;

})();

OutcomeService = (function() {
  OutcomeService.prototype.REQUEST_REPLACE = 'replaceResult';

  OutcomeService.prototype.REQUEST_READ = 'readResult';

  OutcomeService.prototype.REQUEST_DELETE = 'deleteResult';

  function OutcomeService(service_url, source_did, provider, language) {
    var parts;
    if (language == null) {
      language = 'en';
    }
    this.service_url = service_url;
    this.source_did = source_did;
    this.provider = provider;
    this.language = language;
    parts = this.service_url_parts = url.parse(this.service_url);
    this.service_url_oauth = parts.protocol + '//' + parts.host + parts.pathname;
  }

  OutcomeService.prototype.send_replace_result = function(score, callback) {
    var doc, err;
    doc = new OutcomeDocument(this.REQUEST_REPLACE, this.source_did, this.provider);
    try {
      doc.add_score(score, this.language);
      return this._send_request(doc, callback);
    } catch (_error) {
      err = _error;
      return callback(err, false);
    }
  };

  OutcomeService.prototype.send_read_result = function(callback) {
    var doc;
    doc = new OutcomeDocument(this.REQUEST_READ, this.source_did, this.provider);
    return this._send_request(doc, (function(_this) {
      return function(err, result, xml) {
        var score;
        if (err) {
          return callback(err, result);
        }
        score = parseFloat(navigateXml(xml, 'imsx_POXBody.readResultResponse.result.resultScore.textString'), 10);
        if (isNaN(score)) {
          return callback(new errors.OutcomeResponseError('Invalid score response'), false);
        } else {
          return callback(null, score);
        }
      };
    })(this));
  };

  OutcomeService.prototype.send_delete_result = function(callback) {
    var doc;
    doc = new OutcomeDocument(this.REQUEST_DELETE, this.source_did, this.provider);
    return this._send_request(doc, callback);
  };

  OutcomeService.prototype._send_request = function(doc, callback) {
    var body, is_ssl, options, req, xml;
    xml = doc.finalize();
    body = '';
    is_ssl = this.service_url_parts.protocol === 'https:';
    options = {
      hostname: this.service_url_parts.hostname,
      agent: is_ssl ? https.globalAgent : http.globalAgent,
      path: this.service_url_parts.path,
      method: 'POST',
      headers: this._build_headers(xml)
    };
    if (this.service_url_parts.port) {
      options.port = this.service_url_parts.port;
    }
    req = http.request(options, (function(_this) {
      return function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          return body += chunk;
        });
        return res.on('end', function() {
          if (res.statusCode === 200) {
            return _this._process_response(body, callback);
          } else {
            return callback(new errors.OutcomeResponseError('Incorrect authentication credentials'), false);
          }
        });
      };
    })(this));
    req.on('error', (function(_this) {
      return function(err) {
        return callback(err, false);
      };
    })(this));
    req.write(xml);
    return req.end();
  };

  OutcomeService.prototype._build_headers = function(body) {
    var headers, key, val;
    headers = {
      oauth_version: '1.0',
      oauth_nonce: uuid.v4(),
      oauth_timestamp: Math.round(Date.now() / 1000),
      oauth_consumer_key: this.provider.consumer_key,
      oauth_body_hash: crypto.createHash('sha1').update(body).digest('base64'),
      oauth_signature_method: 'HMAC-SHA1'
    };
    headers.oauth_signature = this.provider.signer.build_signature_raw(this.service_url_oauth, this.service_url_parts, 'POST', headers, this.provider.consumer_secret);
    return {
      Authorization: 'OAuth realm="",' + ((function() {
        var _results;
        _results = [];
        for (key in headers) {
          val = headers[key];
          _results.push("" + key + "=\"" + (encodeURIComponent(val)) + "\"");
        }
        return _results;
      })()).join(','),
      'Content-Type': 'application/xml',
      'Content-Length': body.length
    };
  };

  OutcomeService.prototype._process_response = function(body, callback) {
    return xml2js.parseString(body, {
      trim: true
    }, (function(_this) {
      return function(err, result) {
        var code, response;
        if (err) {
          return callback(new errors.OutcomeResponseError('The server responsed with an invalid XML document'), false);
        }
        response = result != null ? result.imsx_POXEnvelopeResponse : void 0;
        code = navigateXml(response, 'imsx_POXHeader.imsx_POXResponseHeaderInfo.imsx_statusInfo.imsx_codeMajor');
        if (code !== 'success') {
          return callback(new errors.OutcomeResponseError('The request provided was invalid'), false);
        } else {
          return callback(null, true, response);
        }
      };
    })(this));
  };

  return OutcomeService;

})();

module.exports = OutcomeService;
