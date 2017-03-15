const rewire = require('rewire')
const td = require('testdouble')
const StreamClient = rewire('../../../src/lib/client')

const request = td.function()

StreamClient.__set__('request', request)

module.exports = {
  request: request,
  StreamClient: StreamClient
}
