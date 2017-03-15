/* global describe, it, beforeEach, afterEach */
const errors = require('../../../src/getstream').errors
const expect = require('expect.js')
const Promise = require('../../../src/lib/promise')
const td = require('testdouble')
const beforeEachFn = require('../utils/hooks').beforeEach

describe('[UNIT] Stream Client Batch (Node)', function () {
  beforeEach(beforeEachFn)

  afterEach(function () {
    td.reset()
  })

  function replaceMSR () {
    const msr = td.function()
    td.replace(this.client, 'makeSignedRequest', msr)
    return msr
  }

  it('#addToMany', function () {
    expect(this.client.addToMany).to.be.a(Function)

    const msr = replaceMSR.call(this)

    const activity = { actor: 'matthisk', object: 0, verb: 'tweet' }
    const feeds = [ 'global:feed', 'global:feed2' ]

    this.client.addToMany(activity, feeds)

    td.verify(msr({
      url: 'feed/add_to_many/',
      body: {
        activity: activity,
        feeds: feeds
      }
    }, undefined))
  })

  it('#followMany', function () {
    expect(this.client.followMany).to.be.a(Function)

    const msr = replaceMSR.call(this)

    const follows = []
    const cb = function () {}

    this.client.followMany(follows, 10, cb)

    td.verify(msr({
      url: 'follow_many/',
      body: follows,
      qs: {
        'activity_copy_limit': 10
      }
    }, cb))
  })

  it('#followMany', function () {
    expect(this.client.followMany).to.be.a(Function)

    const msr = replaceMSR.call(this)

    const follows = []
    const cb = function () {}

    this.client.followMany(follows, cb)

    td.verify(msr({
      url: 'follow_many/',
      body: follows,
      qs: {}
    }, cb))
  })

  it('#makeSignedRequest', function () {
    const self = this
    td.replace(this.client, 'apiSecret', '')

    function throws () {
      self.client.makeSignedRequest({})
    }

    expect(throws).to.throwException(function (err) {
      expect(err).to.be.a(errors.SiteError)
    })
  })

  it('#makeSignedRequest', function () {
    const p = this.client.makeSignedRequest({})

    expect(p).to.be.a(Promise)
  })
})
