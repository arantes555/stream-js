/* global describe, it, beforeEach, afterEach */
const expect = require('expect.js')
const beforeEachFn = require('../utils/hooks').beforeEach
const init = require('../utils/hooks').init
const td = require('testdouble')
const errors = require('../../../src/getstream').errors
const StreamFeed = require('../../../src/lib/feed')

describe('[UNIT] Stream Feed (Common)', function () {
  let get, post, del, feed

  init.call(this)
  beforeEach(beforeEachFn)
  beforeEach(function () {
    feed = new StreamFeed(this.client, 'user', 'matthisk', 'token')
    post = td.function()
    del = td.function()
    get = td.function()
    td.replace(this.client, 'post', post)
    td.replace(this.client, 'delete', del)
    td.replace(this.client, 'get', get)
  })

  afterEach(function () {
    td.reset()
  })

  it('#intialize', function () {
    expect(feed.client).to.be(this.client)
    expect(feed.slug).to.be('user')
    expect(feed.userId).to.be('matthisk')
    expect(feed.id).to.be('user:matthisk')
    expect(feed.feedUrl).to.be('user/matthisk')
    expect(feed.feedTogether).to.be('usermatthisk')
    expect(feed.signature).to.be('usermatthisk token')
    expect(feed.notificationChannel).to.be('site-' + this.client.appId + '-feed-usermatthisk')
  })

  describe('#addActivity', function () {
    const activity = { actor: 'matthisk', object: 0, verb: 'tweet' }

    it('(1)', function () {
      feed.addActivity(activity)

      td.verify(post({
        url: 'feed/user/matthisk/',
        body: activity,
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(2)', function () {
      const cb = function () {}
      feed.addActivity(activity, cb)

      td.verify(post({
        url: 'feed/user/matthisk/',
        body: activity,
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#addActivities', function () {
    const activities = [ { actor: 'matthisk', object: 0, verb: 'tweet' } ]

    it('(1)', function () {
      feed.addActivities(activities)

      td.verify(post({
        url: 'feed/user/matthisk/',
        body: { activities: activities },
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(2)', function () {
      const cb = function () {}
      feed.addActivities(activities, cb)

      td.verify(post({
        url: 'feed/user/matthisk/',
        body: { activities: activities },
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#follow', function () {
    it('(1) throws', function () {
      function throws1 () {
        feed.follow('user###', 'henk')
      }

      function throws2 () {
        feed.follow('user', '###henk')
      }

      expect(throws1).to.throw
      expect(throws2).to.throw
    })

    it('(2) default', function () {
      feed.follow('user', 'henk')

      const body = {
        target: 'user:henk'
      }

      td.verify(post({
        url: 'feed/user/matthisk/following/',
        body: body,
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(3) with cb', function () {
      const cb = function () {}
      feed.follow('user', 'henk', cb)

      const body = {
        target: 'user:henk'
      }

      td.verify(post({
        url: 'feed/user/matthisk/following/',
        body: body,
        signature: 'usermatthisk token'
      }, cb))
    })

    it('(4) activity copy limit', function () {
      feed.follow('user', 'henk', { limit: 10 })

      const body = {
        target: 'user:henk',
        activity_copy_limit: 10
      }

      td.verify(post({
        url: 'feed/user/matthisk/following/',
        body: body,
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(5) with cb and activity copy limit', function () {
      const cb = function () {}
      feed.follow('user', 'henk', { limit: 10 }, cb)

      const body = {
        target: 'user:henk',
        activity_copy_limit: 10
      }

      td.verify(post({
        url: 'feed/user/matthisk/following/',
        body: body,
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#unfollow', function () {
    it('(1) throws', function () {
      function throws1 () {
        feed.unfollow('user###', 'henk')
      }

      function throws2 () {
        feed.unfollow('user', '###henk')
      }

      expect(throws1).to.throw
      expect(throws2).to.throw
    })

    it('(2) default', function () {
      feed.unfollow('user', 'henk')

      td.verify(del({
        url: 'feed/user/matthisk/following/user:henk/',
        qs: {},
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(3) default cb', function () {
      const cb = function () {}
      feed.unfollow('user', 'henk', cb)

      td.verify(del({
        url: 'feed/user/matthisk/following/user:henk/',
        qs: {},
        signature: 'usermatthisk token'
      }, cb))
    })

    it('(4) default keep_history', function () {
      feed.unfollow('user', 'henk', { keepHistory: true })

      td.verify(del({
        url: 'feed/user/matthisk/following/user:henk/',
        qs: {
          keep_history: '1'
        },
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(5) default cb keep_history', function () {
      const cb = function () {}
      feed.unfollow('user', 'henk', { keepHistory: true }, cb)

      td.verify(del({
        url: 'feed/user/matthisk/following/user:henk/',
        qs: {
          keep_history: '1'
        },
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#following', function () {
    it('(1) default', function () {
      feed.following({})

      td.verify(get({
        url: 'feed/user/matthisk/following/',
        qs: {},
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(2) cb', function () {
      const cb = function () {}
      feed.following({}, cb)

      td.verify(get({
        url: 'feed/user/matthisk/following/',
        qs: {},
        signature: 'usermatthisk token'
      }, cb))
    })

    it('(3) options', function () {
      const cb = function () {}
      const filter = [ 'a', 'b', 'c' ]
      feed.following({ filter: filter }, cb)

      td.verify(get({
        url: 'feed/user/matthisk/following/',
        qs: {
          filter: 'a,b,c'
        },
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#followers', function () {
    it('(1) default', function () {
      feed.followers({})

      td.verify(get({
        url: 'feed/user/matthisk/followers/',
        qs: {},
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(2) cb', function () {
      const cb = function () {}
      feed.followers({}, cb)

      td.verify(get({
        url: 'feed/user/matthisk/followers/',
        qs: {},
        signature: 'usermatthisk token'
      }, cb))
    })

    it('(3) options', function () {
      const cb = function () {}
      const filter = [ 'a', 'b', 'c' ]
      feed.followers({ filter: filter }, cb)

      td.verify(get({
        url: 'feed/user/matthisk/followers/',
        qs: {
          filter: 'a,b,c'
        },
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#get', function () {
    it('(1) default', function () {
      feed.get({})

      td.verify(get({
        url: 'feed/user/matthisk/',
        qs: {},
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(2) cb', function () {
      const cb = function cb () {}
      feed.get({}, cb)

      td.verify(get({
        url: 'feed/user/matthisk/',
        qs: {},
        signature: 'usermatthisk token'
      }, cb))
    })

    it('(3) default', function () {
      feed.get({
        mark_read: ['a', 'b'],
        mark_seen: ['c', 'd']
      })

      td.verify(get({
        url: 'feed/user/matthisk/',
        qs: {
          mark_read: 'a,b',
          mark_seen: 'c,d'
        },
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(4) options plus cb', function () {
      const cb = function () {}
      feed.get({
        mark_read: ['a', 'b'],
        mark_seen: ['c', 'd']
      }, cb)

      td.verify(get({
        url: 'feed/user/matthisk/',
        qs: {
          mark_read: 'a,b',
          mark_seen: 'c,d'
        },
        signature: 'usermatthisk token'
      }, cb))
    })
  })

  describe('#subscribe', function () {
    it('(1) throws', function () {
      td.replace(this.client, 'appId', 0)

      function throws () {
        feed.subscribe()
      }

      expect(throws).to.throwException(function (err) {
        expect(err).to.be.a(errors.SiteError)
      })
    })

    it('(2) default', function () {
      td.replace(this.client, 'appId', 1234)

      const fn = td.function()
      const subscribeFn = td.function()

      td.when(fn()).thenReturn({
        subscribe: subscribeFn
      })

      td.replace(this.client, 'getFayeClient', fn)

      feed.subscribe()

      td.verify(subscribeFn('/' + feed.notificationChannel, undefined))
    })

    it('(3) cb', function () {
      const cb = function () {}
      td.replace(this.client, 'appId', 1234)

      const fn = td.function()
      const subscribeFn = td.function()

      td.when(fn()).thenReturn({
        subscribe: subscribeFn
      })

      td.replace(this.client, 'getFayeClient', fn)

      feed.subscribe(cb)

      td.verify(subscribeFn('/' + feed.notificationChannel, cb))
    })
  })

  describe('#removeActivity', function () {
    it('(1)', function () {
      feed.removeActivity('aID')

      td.verify(del({
        url: 'feed/user/matthisk/aID/',
        qs: {},
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(2)', function () {
      feed.removeActivity({ foreignId: 'fID' })

      td.verify(del({
        url: 'feed/user/matthisk/fID/',
        qs: { 'foreign_id': '1' },
        signature: 'usermatthisk token'
      }, undefined))
    })

    it('(3)', function () {
      const cb = function () {}
      feed.removeActivity('aID', cb)

      td.verify(del({
        url: 'feed/user/matthisk/aID/',
        qs: {},
        signature: 'usermatthisk token'
      }, cb))
    })
  })
})
