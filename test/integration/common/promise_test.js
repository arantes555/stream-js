/* global describe, it, beforeEach */
const init = require('../utils/hooks').init
const beforeEachFn = require('../utils/hooks').beforeEach

describe('[INTEGRATION] Stream client (Promises)', function () {
  init.call(this)
  beforeEach(beforeEachFn)

  it('get promises', function () {
    return this.user1.get({
      'limit': 1
    })
  })

  it('post promises', function () {
    const activity = {
      'actor': 'test-constious:characters',
      'verb': 'add',
      'object': 1,
      'tweet': 'hello world'
    }
    return this.user1.addActivity(activity)
  })

  it('post promises fail', function (done) {
    const activity = {
      'actor': 'test-constious:characters',
      'verb': 'add',
      'object': '',
      'tweet': 'hello world'
    }

    this.user1.addActivity(activity)
      .then(function () {
        done('expected failure')
      }, function () {
        done()
      })
  })
})
