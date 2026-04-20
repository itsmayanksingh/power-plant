function paginate ({ page = 1, limit = 20 }) {
  const safePage = Number(page) > 0 ? Number(page) : 1
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20
  const offset = (safePage - 1) * safeLimit
  return { page: safePage, limit: safeLimit, offset }
}

module.exports = { paginate }
