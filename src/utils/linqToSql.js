// Simple LINQ-to-SQL converter for common patterns.
// NOT a full parser — handles the patterns used in this app's challenges.
// Comes with a warning that it's approximate.

export function convertLinqToSql(linq) {
  if (!linq || !linq.trim()) return null;

  const clean = linq.trim()
    .replace(/;\s*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ');

  let result = null;

  // Pattern: collection.Where(x => x.Prop == value)
  result = result || trySimpleWhere(clean);

  // Pattern: collection.Select(x => new { ... })
  result = result || trySelect(clean);

  // Pattern: source.Join(target, ...) — INNER JOIN
  result = result || tryJoin(clean);

  // Pattern: source.GroupJoin(...).SelectMany(...) — LEFT JOIN
  result = result || tryLeftJoin(clean);

  // Pattern: collection.GroupBy(x => x.Key).Select(g => new { ... })
  result = result || tryGroupBy(clean);

  // Pattern: collection.OrderBy/OrderByDescending + Take/Skip
  result = result || trySortLimit(clean);

  // Pattern: collection.Count/Sum/Average/Min/Max
  result = result || tryAggregate(clean);

  return result;
}

function trySimpleWhere(linq) {
  // collection.Where(x => x.Prop op value)
  const match = linq.match(/^(\w+)\.Where\(\s*(\w+)\s*=>\s*(.+)\)$/i);
  if (!match) return null;

  const [, table, param, condition] = match;
  const sqlCondition = convertCondition(condition, param, table);
  if (!sqlCondition) return null;

  return `SELECT *\nFROM ${table}\nWHERE ${sqlCondition};`;
}

function trySelect(linq) {
  // collection.Where(...).Select(...) or just collection.Select(...)
  const whereSelectMatch = linq.match(/^(\w+)\.Where\(\s*(\w+)\s*=>\s*(.+?)\)\.Select\(\s*(\w+)\s*=>\s*new\s*\{(.+)\}\s*\)$/i);
  if (whereSelectMatch) {
    const [, table, wParam, condition, sParam, fields] = whereSelectMatch;
    const sqlCondition = convertCondition(condition, wParam, table);
    const columns = convertSelectFields(fields, sParam, table);
    return `SELECT ${columns}\nFROM ${table}\nWHERE ${sqlCondition};`;
  }

  const selectMatch = linq.match(/^(\w+)\.Select\(\s*(\w+)\s*=>\s*new\s*\{(.+)\}\s*\)$/i);
  if (selectMatch) {
    const [, table, param, fields] = selectMatch;
    const columns = convertSelectFields(fields, param, table);
    return `SELECT ${columns}\nFROM ${table};`;
  }

  return null;
}

function tryJoin(linq) {
  // source.Join(target, outer => outer.Key, inner => inner.FK, (o, i) => new { ... })
  const match = linq.match(/^(\w+)\.Join\(\s*(\w+)\s*,\s*(\w+)\s*=>\s*\3\.(\w+)\s*,\s*(\w+)\s*=>\s*\5\.(\w+)\s*,\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>\s*new\s*\{(.+)\}\s*\)$/i);
  if (!match) return null;

  const [, source, target, , outerKey, , innerKey, oParam, iParam, fields] = match;
  const columns = convertJoinFields(fields, oParam, source, iParam, target);
  return `SELECT ${columns}\nFROM ${source}\nINNER JOIN ${target}\n  ON ${source}.${camelToSnake(outerKey)} = ${target}.${camelToSnake(innerKey)};`;
}

function tryLeftJoin(linq) {
  // source.GroupJoin(target, ...).SelectMany(...)
  const match = linq.match(/^(\w+)\.GroupJoin\(\s*(\w+)\s*,\s*(\w+)\s*=>\s*\3\.(\w+)\s*,\s*(\w+)\s*=>\s*\5\.(\w+)/i);
  if (!match) return null;

  const [, source, target, , outerKey, , innerKey] = match;
  // Extract final projection if possible
  const projMatch = linq.match(/=>\s*new\s*\{([^}]+)\}\s*\)\s*$/);
  const columns = projMatch ? convertGenericFields(projMatch[1], source, target) : `${source}.*, ${target}.*`;

  return `SELECT ${columns}\nFROM ${source}\nLEFT JOIN ${target}\n  ON ${source}.${camelToSnake(outerKey)} = ${target}.${camelToSnake(innerKey)};`;
}

function tryGroupBy(linq) {
  const match = linq.match(/^(\w+)(?:\.Where\(\s*(\w+)\s*=>\s*(.+?)\))?\.GroupBy\(\s*(\w+)\s*=>\s*\4\.(\w+)\s*\)\.Select\(\s*(\w+)\s*=>\s*new\s*\{(.+)\}\s*\)/i);
  if (!match) return null;

  const [, table, wParam, condition, , groupKey, gParam, fields] = match;
  const groupCol = `${table}.${camelToSnake(groupKey)}`;
  const columns = convertGroupFields(fields, gParam, table);

  let sql = `SELECT ${columns}\nFROM ${table}`;
  if (condition && wParam) {
    sql += `\nWHERE ${convertCondition(condition, wParam, table)}`;
  }
  sql += `\nGROUP BY ${groupCol}`;

  // Check for HAVING (.Where after GroupBy+Select)
  const havingMatch = linq.match(/\)\.Where\(\s*\w+\s*=>\s*\w+\.(\w+)\s*(>|<|>=|<=|==|!=)\s*(\d+)\s*\)/);
  if (havingMatch) {
    const [, prop, op, val] = havingMatch;
    const sqlOp = op === '==' ? '=' : op;
    sql += `\nHAVING ${camelToSnake(prop)} ${sqlOp} ${val}`;
  }

  // Check for OrderBy/Take
  const orderMatch = linq.match(/\.OrderByDescending\(\s*\w+\s*=>\s*\w+\.(\w+)\s*\)/);
  if (orderMatch) {
    sql += `\nORDER BY ${camelToSnake(orderMatch[1])} DESC`;
  }
  const takeMatch = linq.match(/\.Take\((\d+)\)/);
  if (takeMatch) {
    sql += `\nLIMIT ${takeMatch[1]}`;
  }

  return sql + ';';
}

function trySortLimit(linq) {
  const match = linq.match(/^(\w+)(?:\.Where\(\s*(\w+)\s*=>\s*(.+?)\))?(\.OrderBy(?:Descending)?\(\s*\w+\s*=>\s*\w+\.(\w+)\s*\))?(\.Skip\((\d+)\))?(\.Take\((\d+)\))?$/i);
  if (!match || (!match[4] && !match[6] && !match[8])) return null;

  const [, table, wParam, condition, orderClause, orderProp, , skipN, , takeN] = match;
  let sql = `SELECT *\nFROM ${table}`;
  if (condition && wParam) {
    sql += `\nWHERE ${convertCondition(condition, wParam, table)}`;
  }
  if (orderProp) {
    const desc = orderClause.includes('Descending');
    sql += `\nORDER BY ${table}.${camelToSnake(orderProp)}${desc ? ' DESC' : ''}`;
  }
  if (takeN) sql += `\nLIMIT ${takeN}`;
  if (skipN) sql += ` OFFSET ${skipN}`;

  return sql + ';';
}

function tryAggregate(linq) {
  const match = linq.match(/^(\w+)\.(Count|Sum|Average|Min|Max)\(\s*(?:(\w+)\s*=>\s*\3\.(\w+))?\s*\)$/i);
  if (!match) return null;

  const [, table, func, , prop] = match;
  const sqlFunc = func === 'Average' ? 'AVG' : func.toUpperCase();
  const col = prop ? `${table}.${camelToSnake(prop)}` : '*';

  return `SELECT ${sqlFunc}(${col})\nFROM ${table};`;
}

// --- Helpers ---

function convertCondition(condition, param, table) {
  let sql = condition
    .replace(new RegExp(`${param}\\.`, 'g'), `${table}.`)
    .replace(/==/g, '=')
    .replace(/!=/g, '!=')
    .replace(/&&/g, 'AND')
    .replace(/\|\|/g, 'OR')
    .replace(/"/g, "'");

  // Convert property names to snake_case
  sql = sql.replace(new RegExp(`${table}\\.([A-Z]\\w*)`, 'g'), (_, prop) => `${table}.${camelToSnake(prop)}`);
  return sql;
}

function convertSelectFields(fields, param, table) {
  return fields.split(',').map(f => {
    f = f.trim();
    const aliasMatch = f.match(/^(\w+)\s*=\s*(.+)$/);
    if (aliasMatch) {
      const [, alias, expr] = aliasMatch;
      const sqlExpr = expr.replace(new RegExp(`${param}\\.`, 'g'), `${table}.`);
      return `${sqlExpr} AS ${camelToSnake(alias)}`;
    }
    return `${table}.${camelToSnake(f.replace(new RegExp(`^${param}\\.`), ''))}`;
  }).join(', ');
}

function convertJoinFields(fields, oParam, source, iParam, target) {
  return fields.split(',').map(f => {
    f = f.trim();
    if (f.startsWith(`${oParam}.`)) return `${source}.${camelToSnake(f.replace(`${oParam}.`, ''))}`;
    if (f.startsWith(`${iParam}.`)) return `${target}.${camelToSnake(f.replace(`${iParam}.`, ''))}`;
    return f;
  }).join(', ');
}

function convertGroupFields(fields, gParam, table) {
  return fields.split(',').map(f => {
    f = f.trim();
    const aliasMatch = f.match(/^(\w+)\s*=\s*(.+)$/);
    if (aliasMatch) {
      const [, alias, expr] = aliasMatch;
      let sqlExpr = expr.trim();
      // g.Key
      if (sqlExpr === `${gParam}.Key`) return `${table}.${camelToSnake(alias)}`;
      // g.Count()
      if (sqlExpr.match(/\.Count\(\)/)) return `COUNT(*) AS ${camelToSnake(alias)}`;
      // g.Sum(x => x.Prop)
      const sumMatch = sqlExpr.match(/\.Sum\(\s*\w+\s*=>\s*\w+\.(\w+)\s*\)/);
      if (sumMatch) return `SUM(${table}.${camelToSnake(sumMatch[1])}) AS ${camelToSnake(alias)}`;
      const avgMatch = sqlExpr.match(/\.Average\(\s*\w+\s*=>\s*\w+\.(\w+)\s*\)/);
      if (avgMatch) return `AVG(${table}.${camelToSnake(avgMatch[1])}) AS ${camelToSnake(alias)}`;
      return `${sqlExpr} AS ${camelToSnake(alias)}`;
    }
    if (f === `${gParam}.Key`) return `${table}_id`;
    return f;
  }).join(', ');
}

function convertGenericFields(fields, source, target) {
  return fields.split(',').map(f => {
    f = f.trim();
    // temp.customer.Name → source.name
    const dotMatch = f.match(/\w+\.(\w+)\.(\w+)/);
    if (dotMatch) {
      const tbl = dotMatch[1] === source || dotMatch[1].toLowerCase().startsWith(source.slice(0, 4)) ? source : target;
      return `${tbl}.${camelToSnake(dotMatch[2])}`;
    }
    return f;
  }).join(', ');
}

function camelToSnake(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}
