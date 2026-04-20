function getUtcDateString (date = new Date()) {
  return date.toISOString().slice(0, 10)
}

module.exports = { getUtcDateString }
