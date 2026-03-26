// db-local.js - Python/빌드 도구 없이 동작하는 JSON 파일 기반 데이터베이스
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'dev-db.json');

function loadData() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], categories: [], products: [], orders: [], inquiries: [], settings: [], notifications: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function matchItem(item, conds) {
  for (const cond of conds) {
    const v = item[cond.key];
    if (cond.op === '=')    { if (v != cond.val) return false; }
    if (cond.op === '!=')   { if (v == cond.val) return false; }
    if (cond.op === 'ilike') {
      const pat = cond.val.replace(/%/g, '').toLowerCase();
      if (!String(v || '').toLowerCase().includes(pat)) return false;
    }
  }
  return true;
}

// 서브쿼리 빌더 (WHERE 콜백 안에서 OR 조건용)
class SubQB {
  constructor() { this._conds = []; }
  whereILike(key, val)  { this._conds.push({ key, op: 'ilike', val }); return this; }
  orWhereILike(key, val){ this._conds.push({ key, op: 'ilike', val }); return this; }
}

// 메인 쿼리 빌더
class QB {
  constructor(table) {
    this._table    = table;
    this._conds    = [];   // AND 조건
    this._groups   = [];   // AND로 묶인 OR 그룹
    this._orderKey = null;
    this._orderDir = 'asc';
    this._selFields  = null;
    this._countAlias = null;
    this._sumField   = null;
    this._sumAlias   = null;
    this._isFirst    = false;
  }

  // where(key, val) / where(key, op, val) / where(fn) 모두 지원
  where(keyOrFn, opOrVal, val) {
    if (typeof keyOrFn === 'function') {
      const sub = new SubQB();
      keyOrFn.call(sub);
      this._groups.push(sub._conds);
    } else if (val !== undefined) {
      this._conds.push({ key: keyOrFn, op: opOrVal, val });
    } else {
      this._conds.push({ key: keyOrFn, op: '=', val: opOrVal });
    }
    return this;
  }

  whereILike(key, val) { this._conds.push({ key, op: 'ilike', val }); return this; }
  select(...fields)    { this._selFields = fields.flat(); return this; }

  count(expr) {
    this._countAlias = (expr.split(' as ')[1] || 'count').trim();
    return this;
  }

  sum(expr) {
    const p = expr.split(' as ');
    this._sumField = p[0].trim();
    this._sumAlias = (p[1] || 'total').trim();
    return this;
  }

  orderBy(key, dir = 'asc') { this._orderKey = key; this._orderDir = dir; return this; }
  first() { this._isFirst = true; return this; }

  _filter(items) {
    return items.filter(item => {
      if (!matchItem(item, this._conds)) return false;
      for (const grp of this._groups) {
        if (!grp.some(c => matchItem(item, [c]))) return false;
      }
      return true;
    });
  }

  _resolve(data) {
    let items = this._filter([...(data[this._table] || [])]);

    if (this._countAlias !== null) return { [this._countAlias]: items.length };

    if (this._sumField) {
      const total = items.reduce((s, i) => s + (Number(i[this._sumField]) || 0), 0);
      return { [this._sumAlias]: total };
    }

    if (this._orderKey) {
      const k = this._orderKey, d = this._orderDir;
      items.sort((a, b) => {
        if (a[k] < b[k]) return d === 'asc' ? -1 : 1;
        if (a[k] > b[k]) return d === 'asc' ? 1 : -1;
        return 0;
      });
    }

    if (this._selFields) {
      items = items.map(item =>
        Object.fromEntries(this._selFields.map(f => [f, item[f]]))
      );
    }

    return this._isFirst ? (items[0] ?? null) : items;
  }

  insert(rows) {
    const data  = loadData();
    const table = data[this._table] || [];
    const arr   = Array.isArray(rows) ? rows : [rows];
    const ids   = [];

    for (const row of arr) {
      const maxId = table.length ? Math.max(...table.map(i => i.id || 0)) : 0;
      const item  = {
        id: maxId + 1,
        ...row,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      table.push(item);
      ids.push(item.id);
    }
    data[this._table] = table;
    saveData(data);
    return Promise.resolve(ids);
  }

  update(updateData) {
    const data  = loadData();
    const items = this._filter(data[this._table] || []);
    for (const item of items) {
      Object.assign(item, updateData, { updated_at: new Date().toISOString() });
    }
    saveData(data);
    return Promise.resolve(items.length);
  }

  del() {
    const data    = loadData();
    const toDelete = new Set(this._filter(data[this._table] || []).map(i => i.id));
    data[this._table] = (data[this._table] || []).filter(i => !toDelete.has(i.id));
    saveData(data);
    return Promise.resolve(toDelete.size);
  }

  // await db('table')... 형태로 사용할 수 있게
  then(resolve, reject) {
    try { resolve(this._resolve(loadData())); }
    catch (e) { reject(e); }
  }
}

// db('tableName') 형태로 호출
const db = (table) => new QB(table);

// migrate / seed 스텁 (로컬은 server.js에서 직접 처리)
db.migrate = { latest: async () => {} };
db.seed    = { run:    async () => {} };

module.exports = db;
