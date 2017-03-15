/* global describe, it, beforeEach */
const StreamFeed = require('../../../src/lib/feed')
const expect = require('expect.js')
const beforeEachFn = require('../utils/hooks').beforeEach
const td = require('testdouble')
const stream = require('../../../src/getstream')

describe('[UNIT] Stream Client (Node)', function () {
  beforeEach(beforeEachFn)

  it('#updateActivities', function () {
    const self = this

    expect(function () {
      self.client.updateActivities('A-String-Thing')
    }).to.throwException(function (e) {
      expect(e).to.be.a(TypeError)
    })
  })

  it('#userAgent', function () {
    const useragent = this.client.userAgent()

    expect(useragent).to.be('stream-javascript-client-node-unknown')
  })

  it('#feed', function () {
    const feed = this.client.feed('user', 'jaap', '123456789')

    expect(feed).to.be.a(StreamFeed)
  })

  describe('#updateActivities', function () {
    it('throws', function () {
      function isGoingToThrow1 () {
        this.client.updateActivities({})
      }

      function isGoingToThrow2 () {
        this.client.updateActivities(0)
      }

      function isGoingToThrow3 () {
        this.client.updateActivities(null)
      }

      function isNotGoingToThrow () {
        this.client.updateActivities([])
      }

      function isTypeError (err) {
        expect(err).to.be.a(TypeError)
      }

      expect(isGoingToThrow1).to.throwException(isTypeError)
      expect(isGoingToThrow2).to.throwException(isTypeError)
      expect(isGoingToThrow3).to.throwException(isTypeError)
      expect(isNotGoingToThrow).to.not.throw
    })

    it('(1) works', function () {
      const post = td.function()
      td.replace(this.client, 'post', post)

      const activities = [ { actor: 'matthisk', object: 0, verb: 'do' } ]

      this.client.updateActivities(activities)

      td.verify(post(td.matchers.contains({
        url: 'activities/'
      }), undefined))
    })

    it('(2) works', function () {
      const post = td.function()
      td.replace(this.client, 'post', post)

      const activities = [ { actor: 'matthisk', object: 0, verb: 'do' } ]
      const fn = function () {}

      this.client.updateActivities(activities, fn)

      td.verify(post(td.matchers.contains({
        url: 'activities/'
      }), fn))
    })

    it('(3) update single activity', function () {
      const post = td.function()
      td.replace(this.client, 'post', post)

      const activities = [ { actor: 'matthisk', object: 0, verb: 'do' } ]

      this.client.updateActivity(activities[0])

      td.verify(post(td.matchers.contains({
        url: 'activities/'
      }), undefined))
    })
  })

  describe('connect', function () {
    it('#LOCAL', function () {
      process.env['LOCAL'] = 1

      const client = stream.connect('12345', 'abcdefghijklmnop')
      expect(client.baseUrl).to.be('http://localhost:8000/api/')

      delete process.env['LOCAL']
    })

    it('#LOCAL', function () {
      const client = stream.connect('12345', 'abcdefghijklmnop', null, {
        location: 'nl-NL'
      })
      expect(client.baseUrl).to.be('https://nl-NL-api.getstream.io/api/')
    })

    it('#LOCAL_FAYE', function () {
      process.env['LOCAL_FAYE'] = 1

      const client = stream.connect('12345', 'abcdefghijklmnop')
      expect(client.fayeUrl).to.be('http://localhost:9999/faye/')

      delete process.env['LOCAL_FAYE']
    })

    it('#STREAM_BASE_URL', function () {
      process.env['STREAM_BASE_URL'] = 'http://local.getstream.io/api/'

      const client = stream.connect('12345', 'abcdefghijklmnop')
      expect(client.baseUrl).to.be('http://local.getstream.io/api/')

      delete process.env['STREAM_BASE_URL']
    })
  })
})
