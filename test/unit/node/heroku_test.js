/* global describe, it */
const beforeEach = require('../utils/hooks').beforeEach
const stream = require('../../../src/getstream')
const expect = require('expect.js')

describe('[UNIT] Stream client (Heroku)', function () {
  beforeEach(beforeEach)

  it('heroku', function (done) {
    process.env.STREAM_URL = 'https://thierry:pass@getstream.io/?app_id=1'
    this.client = stream.connect()
    expect(this.client.apiKey).to.eql('thierry')
    expect(this.client.apiSecret).to.eql('pass')
    expect(this.client.appId).to.eql('1')
    done()
  })

  it('heroku legacy', function (done) {
    process.env.STREAM_URL = 'https://bvt88g4kvc63:twc5ywfste5bm2ngqkzs7ukxk3pn96yweghjrxcmcrarnt3j4dqj3tucbhym5wfd@getstream.io/?app_id=669'
    this.client = stream.connect()
    expect(this.client.apiKey).to.eql('bvt88g4kvc63')
    expect(this.client.apiSecret).to.eql('twc5ywfste5bm2ngqkzs7ukxk3pn96yweghjrxcmcrarnt3j4dqj3tucbhym5wfd')
    expect(this.client.appId).to.eql('669')
    expect(this.client.baseUrl).to.eql('https://api.getstream.io/api/')
    done()
  })

  it('heroku with location', function (done) {
    process.env.STREAM_URL = 'https://ahj2ndz7gsan:gthc2t9gh7pzq52f6cky8w4r4up9dr6rju9w3fjgmkv6cdvvav2ufe5fv7e2r9qy@us-east.getstream.io/?app_id=1'
    this.client = stream.connect()
    expect(this.client.apiKey).to.eql('ahj2ndz7gsan')
    expect(this.client.apiSecret).to.eql('gthc2t9gh7pzq52f6cky8w4r4up9dr6rju9w3fjgmkv6cdvvav2ufe5fv7e2r9qy')
    expect(this.client.appId).to.eql('1')
    expect(this.client.baseUrl).to.eql('https://us-east-api.getstream.io/api/')
    done()
  })

  it('heroku_overwrite', function (done) {
    process.env.STREAM_URL = 'https://thierry:pass@getstream.io/?app_id=1'
    this.client = stream.connect('a', 'b', 'c')
    expect(this.client.apiKey).to.eql('a')
    expect(this.client.apiSecret).to.eql('b')
    expect(this.client.appId).to.eql('c')
    done()
  })
})
