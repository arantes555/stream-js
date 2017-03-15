/* global describe, it */
const qc = require('quickcheck')
const qcJWT = require('../utils/jwt')

describe('[UNIT] Json web token validation', function () {
  this.timeout(10000)

  it('should decode valid jwts headers', function () {
    qc.forAll(qcJWT.propertyHeaderJSON, qcJWT.arbJWT)
  })
})
