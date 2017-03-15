/* global describe, it, beforeEach */
const signing = require('../../../src/lib/signing')
const expect = require('expect.js')
const beforeEachFn = require('../utils/hooks').beforeEach

describe('[UNIT] Creating tokens', function () {
  beforeEach(beforeEachFn)

  it('#getReadOnlyToken', function () {
    const token = this.client.getReadOnlyToken('user', 'test')

    expect(token).not.to.be(undefined)

    const feedId = 'usertest'
    const expected = signing.JWTScopeToken(this.client.apiSecret, '*', 'read', {
      feedId: feedId,
      expireTokens: this.client.expireTokens
    })

    expect(token).to.be(expected)
  })

  it('#getReadWriteToken', function () {
    const token = this.client.getReadWriteToken('user', 'test')

    expect(token).not.to.be(undefined)

    const feedId = 'usertest'
    const expected = signing.JWTScopeToken(this.client.apiSecret, '*', '*', {
      feedId: feedId,
      expireTokens: this.client.expireTokens
    })

    expect(token).to.be(expected)
  })

  it('feed #getReadOnlyToken', function () {
    const token = this.client.feed('user', 'test').getReadOnlyToken()

    expect(token).not.to.be(undefined)

    const feedId = 'usertest'
    const expected = signing.JWTScopeToken(this.client.apiSecret, '*', 'read', {
      feedId: feedId,
      expireTokens: this.client.expireTokens
    })

    expect(token).to.be(expected)
  })

  it('feed #getReadWriteToken', function () {
    const token = this.client.feed('user', 'test').getReadWriteToken()

    expect(token).not.to.be(undefined)

    const feedId = 'usertest'
    const expected = signing.JWTScopeToken(this.client.apiSecret, '*', '*', {
      feedId: feedId,
      expireTokens: this.client.expireTokens
    })

    expect(token).to.be(expected)
  })
})
