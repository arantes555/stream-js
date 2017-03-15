const expect = require('expect.js')
const signing = require('../../../src/lib/signing')
const Promise = require('../../../src/lib/promise')
const config = require('./config')

module.exports.wrapCB = function (expectedStatusCode, done, cb) {
  return function (error, response, body) {
    if (error) return done(error)
    expect(response.statusCode).to.be(expectedStatusCode)

    if (typeof cb === 'function') {
      cb.apply(cb, arguments)
    } else {
      done()
    }
  }
}

module.exports.feed = function (client, feedId, userId) {
  const token = signing.JWTScopeToken(config.API_SECRET, '*', '*', {
    feedId: feedId,
    userId: userId
  }).token

  return client.feed(feedId, userId, token)
}

module.exports.delay = function (s, wth) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(wth)
    }, s)
  })
}
