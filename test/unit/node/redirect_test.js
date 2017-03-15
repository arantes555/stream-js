/* global describe, it, beforeEach */
const config = require('../utils/config')
const jwt = require('jsonwebtoken')
const url = require('url')
const request = require('request')
const expect = require('expect.js')
const beforeEachFn = require('../utils/hooks').beforeEach
const errors = require('../../../src/lib/errors')
const qs = require('qs')

describe('[UNIT] Redirect URL\'s', function () {
  beforeEach(beforeEachFn)

  it('should create email redirects', function () {
    const expectedParts = [ 'https://analytics.getstream.io/analytics/redirect/',
      'auth_type=jwt',
      'url=http%3A%2F%2Fgoogle.com%2F%3Fa%3Db%26c%3Dd',
      'events=%5B%7B%22foreign_ids%22%3A%5B%22tweet%3A1%22%2C%22tweet%3A2%22%2C%22tweet%3A3%22%2C%22tweet%3A4%22%2C%22tweet%3A5%22%5D%2C%22user_id%22%3A%22tommaso%22%2C%22location%22%3A%22email%22%2C%22feed_id%22%3A%22user%3Aglobal%22%7D%2C%7B%22foreign_id%22%3A%22tweet%3A1%22%2C%22label%22%3A%22click%22%2C%22position%22%3A3%2C%22user_id%22%3A%22tommaso%22%2C%22location%22%3A%22email%22%2C%22feed_id%22%3A%22user%3Aglobal%22%7D%5D',
      'api_key=' + config.API_KEY
    ]
    const engagement = {
      'foreign_id': 'tweet:1',
      'label': 'click',
      'position': 3,
      'user_id': 'tommaso',
      'location': 'email',
      'feed_id': 'user:global'
    }
    const impression = {
      'foreign_ids': [ 'tweet:1', 'tweet:2', 'tweet:3', 'tweet:4', 'tweet:5' ],
      'user_id': 'tommaso',
      'location': 'email',
      'feed_id': 'user:global'
    }
    const events = [ impression, engagement ]
    const userId = 'tommaso'
    const targetUrl = 'http://google.com/?a=b&c=d'
    const redirectUrl = this.client.createRedirectUrl(targetUrl, userId, events)

    const queryString = qs.parse(url.parse(redirectUrl).query)
    const decoded = jwt.verify(queryString.authorization, config.API_SECRET)

    expect(decoded).to.eql({
      'resource': 'redirect_and_track',
      'action': '*',
      'user_id': userId
    })

    for (let i = 0; i < expectedParts.length; i++) {
      expect(redirectUrl).to.contain(expectedParts[ i ])
    }
  })

  it('should follow redirect urls', function (done) {
    const events = []
    const userId = 'tommaso'
    const targetUrl = 'http://google.com/?a=b&c=d'
    const redirectUrl = this.client.createRedirectUrl(targetUrl, userId, events)

    request(redirectUrl, function (err, response) {
      if (err) {
        done(err)
      } else if (response.statusCode !== 200) {
        done('Expecting a status code of 200 but got ' + response.statusCode)
      } else if (response.request.uri.hostname.indexOf('google') === -1) {
        done('Did not follow redirect to google')
      } else {
        done()
      }
    })
  })

  it('should fail creating email redirects on invalid targets', function () {
    const self = this
    expect(function () {
      self.client.createRedirectUrl('google.com', 'tommaso', [])
    }).to.throwException(errors.MissingSchemaError)
  })
})
