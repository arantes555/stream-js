const signing = require('../../../src/lib/signing')
const jwt = require('jsonwebtoken')
const qc = require('quickcheck')

function propertyHeaderJSON (jwt) {
  const json = signing.isJWTSignature(jwt)
  return json !== undefined
}

function arbJSON (depth) {
  let width = Math.floor(Math.random() * (10 - 1) + 1)

  const result = {}

  while (width--) {
    let value = qc.arbString()
    const maxDepth = Math.floor(Math.random() * (3 - 1) + 1)

    if (depth) {
      value = arbJSON(depth - 1)
    } else if (depth === undefined) {
      value = arbJSON(maxDepth)
    }

    result[ qc.arbString() ] = value
  }

  return result
}

function arbNonEmptyString () {
  const str = qc.arbString()

  return str === '' ? arbNonEmptyString() : str
}

function arbJWT () {
  return jwt.sign(arbJSON(), arbNonEmptyString(), { algorithm: 'HS256', noTimestamp: true })
}

module.exports = {
  propertyHeaderJSON: propertyHeaderJSON,
  arbJSON: arbJSON,
  arbNonEmptyString: arbNonEmptyString,
  arbJWT: arbJWT
}
