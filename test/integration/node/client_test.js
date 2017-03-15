/* global describe, it, beforeEach */
const stream = require('../../../src/getstream')
const errors = require('../../../src/getstream').errors
const init = require('../utils/hooks').init
const beforeEachFn = require('../utils/hooks').beforeEach
const expect = require('expect.js')
const wrapCB = require('../utils').wrapCB

describe('[INTEGRATION] Stream client (Node)', function () {
  init.call(this)
  beforeEach(beforeEachFn)

  it('get feed', function (done) {
    this.user1.get({
      'limit': 1
    }, function (error, response) {
      if (error) done(error)
      expect(response.statusCode).to.eql(200)

      const userAgent = response.req._headers[ 'x-stream-client' ]
      expect(userAgent.indexOf('stream-javascript-client')).to.eql(0)

      done()
    })
  })

  it('update activities', function () {
    const self = this
    const activities = [ {
      'actor': 1,
      'verb': 'tweet',
      'object': 1,
      'foreign_id': 'update_activity_1'
    }, {
      'actor': 2,
      'verb': 'tweet',
      'object': 3,
      'foreign_id': 'update_activity_1'
    } ]

    return this.user1.addActivities(activities)
      .then(function (body) {
        const activity = body[ 'activities' ][ 0 ]

        activity[ 'answer' ] = 10
        delete activity.to
        delete activity.target
        delete activity.origin

        const activities = [ activity ]

        return self.client.updateActivities(activities)
      })
      .then(function () {
        return self.user1.get({ limit: 2 })
      })
      .then(function (body) {
        const activity = body[ 'results' ][ 1 ]
        expect(activity.answer).to.be(10)
      })
  })

  it('update activity illegal foreign id', function () {
    const self = this

    const activity = {
      'actor': 1,
      'verb': 'tweet',
      'object': 2
    }

    return this.user1.addActivity(activity)
      .then(function (body) {
        const activity = body

        delete activity.id
        delete activity.duration
        delete activity.to
        delete activity.time

        activity[ 'foreign_id' ] = 'aap'

        return self.client.updateActivity(activity)
      })
      .then(function () {
        throw new Error('Expected InputException')
      })
      .catch(function (reason) {
        expect(reason.error.code).to.be(4)
        expect(reason.error.exception).to.be('InputException')
      })
  })

  it('update activity illegal time', function () {
    const self = this

    const activity = {
      'actor': 1,
      'verb': 'tweet',
      'object': 2
    }

    return this.user1.addActivity(activity)
      .then(function (body) {
        const activity = body

        delete activity.duration
        delete activity.to

        activity[ 'time' ] = 'aap'

        return self.client.updateActivity(activity)
      })
      .then(function () {
        throw new Error('Expected InputException')
      })
      .catch(function (reason) {
        expect(reason.error.code).to.be(4)
        expect(reason.error.exception).to.be('InputException')
      })
  })

  it('update activity illegal to field', function () {
    const self = this

    const activity = {
      'actor': 1,
      'verb': 'tweet',
      'object': 2
    }

    return this.user1.addActivity(activity)
      .then(function (body) {
        const activity = body

        delete activity.duration
        delete activity.time

        activity[ 'to' ] = [ 'to:something' ]

        return self.client.updateActivity(activity)
      })
      .then(function () {
        throw new Error('Expected InputException')
      })
      .catch(function (reason) {
        expect(reason.error.code).to.be(4)
        expect(reason.error.exception).to.be('InputException')
      })
  })

  it('updating many activities', function () {
    const self = this
    const activities = []
    for (let i = 0; i < 10; i++) {
      activities.push({
        'verb': 'do',
        'object': 'object:' + i,
        'actor': 'user:' + i,
        'foreign_id': 'update_activities_' + i
      })
    }

    return this.user1.addActivities(activities)
      .then(function (body) {
        const activitiesCreated = body[ 'activities' ]

        for (let j = 0; j < activitiesCreated.length; j++) {
          activitiesCreated[ j ][ 'answer' ] = 100
        }

        return self.client.updateActivities(activitiesCreated)
      })
      .then(function () {
        return self.user1.get({
          limit: 10
        })
      })
      .then(function (body) {
        const activitiesUpdated = body[ 'results' ]

        for (let n = 0; n < activitiesUpdated.length; n++) {
          expect(activitiesUpdated[ n ][ 'answer' ]).to.be(100)
        }
      })
  })

  it('#updateActivity', function () {
    const activity = {
      'verb': 'do',
      'actor': 'user:1',
      'object': 'object:1',
      'time': new Date().toISOString(),
      'foreign_id': 'update_activity_11'
    }

    return this.client.updateActivity(activity)
  })

  it('supports application level authentication', function (done) {
    this.client.makeSignedRequest({
      url: 'test/auth/digest/'
    }, wrapCB(200, done))
  })

  it('fails application level authentication with wrong keys', function (done) {
    const client = stream.connect('aap', 'noot')

    client.makeSignedRequest({
      url: 'test/auth/digest/'
    }, function (error, response, body) {
      if (error) return done(error)
      if (body.exception === 'ApiKeyException') return done()
    })
  })

  it('supports adding activity to multiple feeds', function (done) {
    const activity = {
      'actor': 'user:11',
      'verb': 'like',
      'object': '000'
    }
    const feeds = [ 'flat:33', 'user:11' ]

    this.client.addToMany(activity, feeds, wrapCB(201, done))
  })

  it('supports batch following', function (done) {
    const follows = [ {
      'source': 'flat:1',
      'target': 'user:1'
    }, {
      'source': 'flat:1',
      'target': 'user:2'
    }, {
      'source': 'flat:1',
      'target': 'user:3'
    } ]

    this.client.followMany(follows, null, wrapCB(201, done))
  })

  it('supports batch following with activity_copy_limit', function (done) {
    const follows = [ {
      'source': 'flat:1',
      'target': 'user:1'
    }, {
      'source': 'flat:1',
      'target': 'user:2'
    }, {
      'source': 'flat:1',
      'target': 'user:3'
    } ]

    this.client.followMany(follows, 20, wrapCB(201, done, function (error, response, body) {
      expect(response.req.path.indexOf('activity_copy_limit=20')).to.not.be(0)
      done()
    }))
  })

  it('no secret application auth', function () {
    const client = stream.connect('ahj2ndz7gsan')

    expect(function () {
      client.addToMany({}, [])
    }).to.throwError(function (e) {
      expect(e).to.be.a(errors.SiteError)
    })
  })

  it('batch promises', function () {
    const activity = {
      'actor': 'user:11',
      'verb': 'like',
      'object': '000'
    }
    const feeds = [ 'flat:33', 'user:11' ]

    return this.client.addToMany(activity, feeds)
  })

  it('add activity using to', function () {
    const self = this
    let activityId = null
    const activity = {
      'actor': 1,
      'verb': 'add',
      'object': 1
    }
    activity[ 'participants' ] = [ 'Thierry', 'Tommaso' ]
    activity[ 'route' ] = {
      'name': 'Vondelpark',
      'distance': '20'
    }
    activity[ 'to' ] = [ self.flat3.id, 'user:everyone' ]

    return this.user1.addActivity(activity)
      .then(function (body) {
        activityId = body[ 'id' ]
        return self.flat3.get({ 'limit': 1 })
      })
      .then(function (body) {
        expect(body[ 'results' ][ 0 ][ 'id' ]).to.eql(activityId)
      })
  })
})
