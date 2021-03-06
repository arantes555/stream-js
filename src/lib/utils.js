const errors = require('./errors')
const validRe = /^[\w-]+$/

function validateFeedId (feedId) {
  /*
   * Validate that the feedId matches the spec user:1
   */
  const parts = feedId.split(':')
  if (parts.length !== 2) {
    throw new errors.FeedError('Invalid feedId, expected something like user:1 got ' + feedId)
  }

  const feedSlug = parts[ 0 ]
  const userId = parts[ 1 ]
  validateFeedSlug(feedSlug)
  validateUserId(userId)
  return feedId
}

exports.validateFeedId = validateFeedId

function validateFeedSlug (feedSlug) {
  /*
   * Validate that the feedSlug matches \w
   */
  const valid = validRe.test(feedSlug)
  if (!valid) {
    throw new errors.FeedError('Invalid feedSlug, please use letters, numbers or _ got: ' + feedSlug)
  }

  return feedSlug
}

exports.validateFeedSlug = validateFeedSlug

function validateUserId (userId) {
  /*
   * Validate the userId matches \w
   */
  const valid = validRe.test(userId)
  if (!valid) {
    throw new errors.FeedError('Invalid feedSlug, please use letters, numbers or _ got: ' + userId)
  }

  return userId
}

exports.validateUserId = validateUserId

function rfc3986 (str) {
  return str.replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

exports.rfc3986 = rfc3986
