function toCsv (rows) {
  if (!rows || rows.length === 0) return '\n'
  const header = Object.keys(rows[0])
  const body = rows.map(row => header.map(key => JSON.stringify(row[key] ?? '')).join(','))
  return `${header.join(',')}\n${body.join('\n')}\n`
}

module.exports = { toCsv }
