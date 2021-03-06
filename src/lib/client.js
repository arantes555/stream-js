let request = require('request') // Using let because of rewire in tests
const StreamFeed = require('./feed')
const signing = require('./signing')
const errors = require('./errors')
const utils = require('./utils')
const BatchOperations = require('./batch_operations')
const Promise = require('./promise')
const qs = require('qs')
const url = require('url')
const Faye = require('faye')

/**
 * @callback requestCallback
 * @param {object} [errors]
 * @param {object} response
 * @param {object} body
 */

/**
 * @constructor
 */
const StreamClient = function () {
  /**
   * Client to connect to Stream api
   * @class StreamClient
   */
  this.initialize.apply(this, arguments)
}

StreamClient.prototype = {
  baseUrl: 'https://api.getstream.io/api/',
  baseAnalyticsUrl: 'https://analytics.getstream.io/analytics/',

  initialize: function (apiKey, apiSecret, appId, options) {
    /**
     * Initialize a client
     * @method intialize
     * @memberof StreamClient.prototype
     * @param {string} apiKey - the api key
     * @param {string} [apiSecret] - the api secret
     * @param {string} [appId] - id of the app
     * @param {object} [options] - additional options
     * @param {string} [options.location] - which data center to use
     * @param {boolean} [options.expireTokens=false] - whether to use a JWT timestamp field (i.e. iat)
     * @example <caption>initialize is not directly called by via stream.connect, ie:</caption>
     * stream.connect(apiKey, apiSecret)
     * @example <caption>secret is optional and only used in server side mode</caption>
     * stream.connect(apiKey, null, appId);
     */
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.appId = appId
    this.options = options || {}
    this.version = this.options.version || 'v1.0'
    this.fayeUrl = this.options.fayeUrl || 'https://faye.getstream.io/faye'
    this.fayeClient = null
    // track a source name for the api calls, ie get started or databrowser
    this.group = this.options.group || 'unspecified'
    // track subscriptions made on feeds created by this client
    this.subscriptions = {}
    this.expireTokens = this.options.expireTokens ? this.options.expireTokens : false
    // which data center to use
    this.location = this.options.location

    const protocol = this.options.protocol || 'https'

    if (this.location) {
      this.baseUrl = protocol + '://' + this.location + '-api.getstream.io/api/'
    }

    if (typeof (process) !== 'undefined' && process.env.LOCAL) {
      this.baseUrl = 'http://localhost:8000/api/'
    }

    if (typeof (process) !== 'undefined' && process.env.LOCAL_FAYE) {
      this.fayeUrl = 'http://localhost:9999/faye/'
    }

    if (typeof (process) !== 'undefined' && process.env.STREAM_BASE_URL) {
      this.baseUrl = process.env.STREAM_BASE_URL
    }

    this.handlers = {}
    this.browser = typeof (window) !== 'undefined'
    this.node = !this.browser

    /* istanbul ignore next */
    if (this.browser && this.apiSecret) {
      throw new errors.FeedError('You are publicly sharing your private key. Dont use the private key while in the browser.')
    }
  },

  on: function (event, callback) {
    /**
     * Support for global event callbacks
     * This is useful for generic error and loading handling
     * @method on
     * @memberof StreamClient.prototype
     * @param {string} event - Name of the event
     * @param {function} callback - Function that is called when the event fires
     * @example
     * client.on('request', callback);
     * client.on('response', callback);
     */
    this.handlers[ event ] = callback
  },

  off: function (key) {
    /**
     * Remove one or more event handlers
     * @method off
     * @memberof StreamClient.prototype
     * @param {string} [key] - Name of the handler
     * @example
     * client.off() removes all handlers
     * client.off(name) removes the specified handler
     */
    if (key === undefined) {
      this.handlers = {}
    } else {
      delete this.handlers[ key ]
    }
  },

  send: function () {
    /**
     * Call the given handler with the arguments
     * @method send
     * @memberof StreamClient.prototype
     * @access private
     */
    let args = Array.prototype.slice.call(arguments)
    const key = args[ 0 ]
    args = args.slice(1)
    if (this.handlers[ key ]) {
      this.handlers[ key ].apply(this, args)
    }
  },

  wrapPromiseTask: function (cb, fulfill, reject) {
    /**
     * Wrap a task to be used as a promise
     * @method wrapPromiseTask
     * @memberof StreamClient.prototype
     * @private
     * @param {requestCallback} cb
     * @param {function} fulfill
     * @param {function} reject
     * @return {function}
     */
    const client = this

    const callback = this.wrapCallback(cb)
    return function task (error, response, body) {
      if (error) {
        reject({
          error: error,
          response: response
        })
      } else if (!/^2/.test('' + response.statusCode)) {
        // error = body;
        reject({
          error: body,
          response: response
        })
      } else {
        fulfill(body)
      }

      callback.call(client, error, response, body)
    }
  },

  wrapCallback: function (cb) {
    /**
     * Wrap callback for HTTP request
     * @method wrapCallBack
     * @memberof StreamClient.prototype
     * @access private
     */
    const client = this

    function callback () {
      // first hit the global callback, subsequently forward
      const args = Array.prototype.slice.call(arguments)
      const sendArgs = [ 'response' ].concat(args)
      client.send.apply(client, sendArgs)
      if (cb !== undefined) {
        cb.apply(client, args)
      }
    }

    return callback
  },

  userAgent: function () {
    /**
     * Get the current user agent
     * @method userAgent
     * @memberof StreamClient.prototype
     * @return {string} current user agent
     */
    const description = (this.node) ? 'node' : 'browser'
    // TODO: get the version here in a way which works in both and browserify
    const version = 'unknown'
    return 'stream-javascript-client-' + description + '-' + version
  },

  getReadOnlyToken: function (feedSlug, userId) {
    /**
     * Returns a token that allows only read operations
     *
     * @method getReadOnlyToken
     * @memberof StreamClient.prototype
     * @param {string} feedSlug - The feed slug to get a read only token for
     * @param {string} userId - The user identifier
     * @return {string} token
     * @example
     * client.getReadOnlyToken('user', '1');
     */
    return this.feed(feedSlug, userId).getReadOnlyToken()
  },

  getReadWriteToken: function (feedSlug, userId) {
    /**
     * Returns a token that allows read and write operations
     *
     * @method getReadWriteToken
     * @memberof StreamClient.prototype
     * @param {string} feedSlug - The feed slug to get a read only token for
     * @param {string} userId - The user identifier
     * @return {string} token
     * @example
     * client.getReadWriteToken('user', '1');
     */
    return this.feed(feedSlug, userId).getReadWriteToken()
  },

  feed: function (feedSlug, userId, token, siteId, options) {
    /**
     * Returns a feed object for the given feed id and token
     * @method feed
     * @memberof StreamClient.prototype
     * @param {string} feedSlug - The feed slug
     * @param {string} userId - The user identifier
     * @param {string} [token] - The token
     * @param {string} [siteId] - The site identifier
     * @param {object} [options] - Additional function options
     * @param {boolean} [options.readOnly] - A boolean indicating whether to generate a read only token for this feed
     * @return {StreamFeed}
     * @example
     * client.feed('user', '1', 'token2');
     */

    options = options || {}

    if (!feedSlug || !userId) {
      throw new errors.FeedError('Please provide a feed slug and user id, ie client.feed("user", "1")')
    }

    if (feedSlug.indexOf(':') !== -1) {
      throw new errors.FeedError('Please initialize the feed using client.feed("user", "1") not client.feed("user:1")')
    }

    utils.validateFeedSlug(feedSlug)
    utils.validateUserId(userId)

    // raise an error if there is no token
    if (!this.apiSecret && !token) {
      throw new errors.FeedError('Missing token, in client side mode please provide a feed secret')
    }

    // create the token in server side mode
    if (this.apiSecret && !token) {
      const feedId = '' + feedSlug + userId
      // use scoped token if read-only access is necessary
      token = options.readOnly ? this.getReadOnlyToken(feedSlug, userId) : signing.sign(this.apiSecret, feedId)
    }

    return new StreamFeed(this, feedSlug, userId, token, siteId)
  },

  enrichUrl: function (relativeUrl) {
    /**
     * Combines the base url with version and the relative url
     * @method enrichUrl
     * @memberof StreamClient.prototype
     * @private
     * @param {string} relativeUrl
     */
    return this.baseUrl + this.version + '/' + relativeUrl
  },

  enrichKwargs: function (kwargs) {
    /**
     * Adds the API key and the signature
     * @method enrichKwargs
     * @memberof StreamClient.prototype
     * @param {object} kwargs
     * @private
     */
    kwargs.url = this.enrichUrl(kwargs.url)
    if (kwargs.qs === undefined) {
      kwargs.qs = {}
    }

    kwargs.qs[ 'api_key' ] = this.apiKey
    kwargs.qs.location = this.group
    kwargs.json = true
    let signature = kwargs.signature || this.signature
    kwargs.headers = {}

    // auto-detect authentication type and set HTTP headers accordingly
    if (signing.isJWTSignature(signature)) {
      kwargs.headers[ 'stream-auth-type' ] = 'jwt'
      signature = signature.split(' ').reverse()[ 0 ]
    } else {
      kwargs.headers[ 'stream-auth-type' ] = 'simple'
    }

    kwargs.headers.Authorization = signature
    kwargs.headers[ 'X-Stream-Client' ] = this.userAgent()
    // Make sure withCredentials is not enabled, different browser
    // fallbacks handle it differently by default (meteor)
    kwargs.withCredentials = false
    return kwargs
  },

  signActivity: function (activity) {
    /**
     * We automatically sign the to parameter when in server side mode
     * @method signActivities
     * @memberof StreamClient.prototype
     * @private
     * @param  {object}       [activity] Activity to sign
     */
    return this.signActivities([ activity ])[ 0 ]
  },

  signActivities: function (activities) {
    /**
     * We automatically sign the to parameter when in server side mode
     * @method signActivities
     * @memberof StreamClient.prototype
     * @private
     * @param {array} Activities
     */
    if (!this.apiSecret) {
      return activities
    }

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[ i ]
      const to = activity.to || []
      const signedTo = []
      for (let j = 0; j < to.length; j++) {
        const feedId = to[ j ]
        const feedSlug = feedId.split(':')[ 0 ]
        const userId = feedId.split(':')[ 1 ]
        const token = this.feed(feedSlug, userId).token
        const signedFeed = feedId + ' ' + token
        signedTo.push(signedFeed)
      }

      activity.to = signedTo
    }

    return activities
  },

  getFayeAuthorization: function () {
    /**
     * Get the authorization middleware to use Faye with getstream.io
     * @method getFayeAuthorization
     * @memberof StreamClient.prototype
     * @private
     * @return {object} Faye authorization middleware
     */
    const apiKey = this.apiKey,
      self = this

    return {
      incoming: function (message, callback) {
        callback(message)
      },

      outgoing: function (message, callback) {
        if (message.subscription && self.subscriptions[ message.subscription ]) {
          const subscription = self.subscriptions[ message.subscription ]

          message.ext = {
            'user_id': subscription.userId,
            'api_key': apiKey,
            'signature': subscription.token
          }
        }

        callback(message)
      }
    }
  },

  getFayeClient: function () {
    /**
     * Returns this client's current Faye client
     * @method getFayeClient
     * @memberof StreamClient.prototype
     * @private
     * @return {object} Faye client
     */
    if (this.fayeClient === null) {
      this.fayeClient = new Faye.Client(this.fayeUrl)
      const authExtension = this.getFayeAuthorization()
      this.fayeClient.addExtension(authExtension)
    }

    return this.fayeClient
  },

  get: function (kwargs, cb) {
    /**
     * Shorthand function for get request
     * @method get
     * @memberof StreamClient.prototype
     * @private
     * @param  {object}   kwargs
     * @param  {requestCallback} cb     Callback to call on completion
     * @return {Promise}                Promise object
     */
    return new Promise(function (fulfill, reject) {
      this.send('request', 'get', kwargs, cb)
      kwargs = this.enrichKwargs(kwargs)
      console.log('Request kwargs', kwargs)
      kwargs.method = 'GET'
      const callback = this.wrapPromiseTask(cb, fulfill, reject)
      request(kwargs, callback)
    }.bind(this))
  },

  post: function (kwargs, cb) {
    /**
     * Shorthand function for post request
     * @method post
     * @memberof StreamClient.prototype
     * @private
     * @param  {object}   kwargs
     * @param  {requestCallback} cb     Callback to call on completion
     * @return {Promise}                Promise object
     */
    return new Promise(function (fulfill, reject) {
      this.send('request', 'post', kwargs, cb)
      kwargs = this.enrichKwargs(kwargs)
      console.log('Request kwargs', kwargs)
      kwargs.method = 'POST'
      const callback = this.wrapPromiseTask(cb, fulfill, reject)
      request(kwargs, callback)
    }.bind(this))
  },

  'delete': function (kwargs, cb) {
    /**
     * Shorthand function for delete request
     * @method delete
     * @memberof StreamClient.prototype
     * @private
     * @param  {object}   kwargs
     * @param  {requestCallback} cb     Callback to call on completion
     * @return {Promise}                Promise object
     */
    return new Promise(function (fulfill, reject) {
      this.send('request', 'delete', kwargs, cb)
      kwargs = this.enrichKwargs(kwargs)
      kwargs.method = 'DELETE'
      const callback = this.wrapPromiseTask(cb, fulfill, reject)
      request(kwargs, callback)
    }.bind(this))
  },

  updateActivities: function (activities, callback) {
    /**
     * Updates all supplied activities on the getstream-io api
     * @since  3.1.0
     * @param  {array} activities list of activities to update
     * @return {Promise}
     */
    if (!(activities instanceof Array)) {
      throw new TypeError('The activities argument should be an Array')
    }

    const authToken = signing.JWTScopeToken(this.apiSecret, 'activities', '*', {
      feedId: '*',
      expireTokens: this.expireTokens
    })

    const data = {
      activities: activities
    }

    return this.post({
      url: 'activities/',
      body: data,
      signature: authToken
    }, callback)
  },

  updateActivity: function (activity) {
    /**
     * Updates one activity on the getstream-io api
     * @since  3.1.0
     * @param  {object} activity The activity to update
     * @return {Promise}
     */
    return this.updateActivities([ activity ])
  }

}

if (qs) {
  StreamClient.prototype.createRedirectUrl = function (targetUrl, userId, events) {
    /**
     * Creates a redirect url for tracking the given events in the context of
     * an email using Stream's analytics platform. Learn more at
     * getstream.io/personalization
     * @method createRedirectUrl
     * @memberof StreamClient.prototype
     * @param  {string} targetUrl Target url
     * @param  {string} userId    User id to track
     * @param  {array} events     List of events to track
     * @return {string}           The redirect url
     */
    const uri = url.parse(targetUrl)

    if (!(uri.host || (uri.hostname && uri.port)) && !uri.isUnix) {
      throw new errors.MissingSchemaError('Invalid URI: "' + url.format(uri) + '"')
    }

    const authToken = signing.JWTScopeToken(this.apiSecret, 'redirect_and_track', '*', {
      userId: userId,
      expireTokens: this.expireTokens
    })
    const analyticsUrl = this.baseAnalyticsUrl + 'redirect/'
    const kwargs = {
      'auth_type': 'jwt',
      'authorization': authToken,
      'url': targetUrl,
      'api_key': this.apiKey,
      'events': JSON.stringify(events)
    }

    const qString = utils.rfc3986(qs.stringify(kwargs, null, null, {}))

    return analyticsUrl + '?' + qString
  }
}

// If we are in a node environment and batchOperations is available add the methods to the prototype of StreamClient
if (BatchOperations) {
  for (const key in BatchOperations) {
    if (BatchOperations.hasOwnProperty(key)) {
      StreamClient.prototype[ key ] = BatchOperations[ key ]
    }
  }
}

module.exports = StreamClient
