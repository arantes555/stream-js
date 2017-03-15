/* global describe, it */
const utils = require('../../../src/lib/utils')
const init = require('../utils/hooks').init
const expect = require('expect.js')
const errors = require('../../../src/lib/errors')

describe('[UNIT] Utility functions', function () {
  init.call(this)

  it('should validate feed id\'s', function () {
    expect(utils.validateFeedId('flat:0')).to.be.ok()
  })

  it('should throw exception while validating faulty feed id', function () {
    expect(function () {
      utils.validateFeedId('b134u92fval')
    }).to.throwError(function (e) {
      expect(e).to.be.a(errors.FeedError)
    })
  })

  it('#rfc3986', function () {
    const result = utils.rfc3986('hello!\'()*matthisk')

    expect(result).to.be('hello%21%27%28%29%2Amatthisk')
  })
})
