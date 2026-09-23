const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const modelCache = new Map();
const relationModels = {
  admin: 'Admin',
  candidate: 'Candidate',
  recruiter: 'Recruiter',
  job: 'Job',
  application: 'Application',
  offerLetter: 'OfferLetter',
  payment: 'Payment',
  wallet: 'Wallet',
  referral: 'Referral',
  adminId: 'Admin',
  reviewedBy: 'Admin',
  reportedBy: 'Candidate',
  reviewedByAdmin: 'Admin',
  raisedById: 'Candidate',
  relatedPayment: 'Payment',
  relatedApplication: 'Application',
};

function valueAt(record, key) {
  if (key === '_id') return record.id;
  return key.split('.').reduce((value, part) => value == null ? undefined : value[part], record);
}

function comparable(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return Date.parse(value);
  return value;
}

function evaluate(expression, row) {
  if (typeof expression === 'string' && expression.startsWith('$')) return valueAt(row, expression.slice(1));
  if (Array.isArray(expression)) return expression.map((item) => evaluate(item, row));
  if (!expression || typeof expression !== 'object') return expression;
  const [operator, operand] = Object.entries(expression)[0] || [];
  if (operator === '$eq') { const [left, right] = evaluate(operand, row); return String(left) === String(right); }
  if (operator === '$ne') { const [left, right] = evaluate(operand, row); return String(left) !== String(right); }
  if (operator === '$and') return evaluate(operand, row).every(Boolean);
  if (operator === '$or') return evaluate(operand, row).some(Boolean);
  if (operator === '$cond') { const [condition, whenTrue, whenFalse] = operand; return evaluate(condition, row) ? evaluate(whenTrue, row) : evaluate(whenFalse, row); }
  if (operator === '$year') return new Date(evaluate(operand, row)).getUTCFullYear();
  if (operator === '$month') return new Date(evaluate(operand, row)).getUTCMonth() + 1;
  if (operator === '$dateToString') {
    const date = new Date(evaluate(operand.date, row));
    return operand.format === '%Y-%m-%d' ? date.toISOString().slice(0, 10) : date.toISOString();
  }
  if (operator === '$in') { const [value, values] = operand; return evaluate(values, row).map(String).includes(String(evaluate(value, row))); }
  if (operator === '$sum') return Number(evaluate(operand, row) || 0);
  if (operator === '$literal') return operand;
  return Object.fromEntries(Object.entries(expression).map(([key, value]) => [key, evaluate(value, row)]));
}

function matches(record, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((item) => matches(record, item));
    if (key === '$and') return expected.every((item) => matches(record, item));
    if (key === '$expr') return Boolean(evaluate(expected, record));
    const actual = valueAt(record, key);
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      return Object.entries(expected).every(([operator, operand]) => {
        if (operator === '$options') return true;
        if (operator === '$in') return operand.some((item) => Array.isArray(actual) ? actual.includes(item) : String(actual) === String(item));
        if (operator === '$nin') return !operand.some((item) => String(actual) === String(item));
        if (operator === '$ne') return String(actual) !== String(operand);
        if (operator === '$gte') return comparable(actual) >= comparable(operand);
        if (operator === '$gt') return comparable(actual) > comparable(operand);
        if (operator === '$lte') return comparable(actual) <= comparable(operand);
        if (operator === '$lt') return comparable(actual) < comparable(operand);
        if (operator === '$exists') return operand ? actual !== undefined : actual === undefined;
        if (operator === '$regex') return new RegExp(operand, expected.$options || '').test(String(actual || ''));
        return false;
      });
    }
    if (Array.isArray(actual)) return actual.includes(expected);
    return String(actual) === String(expected);
  });
}

function aggregateRows(rows, pipeline) {
  let current = rows;
  for (const stage of pipeline || []) {
    const [operator, value] = Object.entries(stage)[0] || [];
    if (operator === '$match') current = current.filter((row) => matches(row, value));
    else if (operator === '$sort') {
      const entries = Object.entries(value);
      current.sort((a, b) => { for (const [field, direction] of entries) { const left = valueAt(a, field); const right = valueAt(b, field); if (left !== right) return (left > right ? 1 : -1) * Number(direction); } return 0; });
    } else if (operator === '$limit') current = current.slice(0, value);
    else if (operator === '$skip') current = current.slice(value);
    else if (operator === '$unwind') {
      const path = String(value.path || value).replace(/^\$/, '');
      current = current.flatMap((row) => { const items = valueAt(row, path); if (!Array.isArray(items)) return items == null && value.preserveNullAndEmptyArrays ? [row] : [row]; return items.map((item) => { const copy = JSON.parse(JSON.stringify(row)); setPath(copy, path, item); return copy; }); });
    } else if (operator === '$group') {
      const groups = new Map();
      for (const row of current) {
        const id = evaluate(value._id, row); const key = JSON.stringify(id);
        if (!groups.has(key)) groups.set(key, { _id: id });
        const group = groups.get(key);
        for (const [field, accumulator] of Object.entries(value)) {
          if (field === '_id') continue;
          const [accumulatorName, expression] = Object.entries(accumulator)[0] || [];
          if (accumulatorName === '$sum') group[field] = (group[field] || 0) + (expression === 1 ? 1 : Number(evaluate(expression, row) || 0));
          else if (accumulatorName === '$addToSet') { group[field] ??= []; const item = evaluate(expression, row); if (!group[field].some((existing) => JSON.stringify(existing) === JSON.stringify(item))) group[field].push(item); }
          else if (accumulatorName === '$push') { group[field] ??= []; group[field].push(evaluate(expression, row)); }
          else if (accumulatorName === '$first' && group[field] === undefined) group[field] = evaluate(expression, row);
          else if (accumulatorName === '$last') group[field] = evaluate(expression, row);
        }
      }
      current = [...groups.values()];
    } else if (operator === '$project') {
      current = current.map((row) => { const output = {}; for (const [field, projection] of Object.entries(value)) { if (projection === 0) continue; output[field] = projection === 1 ? valueAt(row, field) : evaluate(projection, row); } if (value._id !== 0) output._id = row._id; return output; });
    } else if (operator === '$count') current = [{ [value]: current.length }];
    else if (operator === '$lookup') {
      const target = [...modelCache.values()].find((model) => model.tableName === value.from || model.tableName.replace(/_/g, '') === value.from);
      current = current.map((row) => { const matchesForJoin = target ? target.findAll().then((instances) => instances.map(expose).filter((item) => String(valueAt(item, value.foreignField)) === String(valueAt(row, value.localField)))) : Promise.resolve([]); return { row, matchesForJoin }; });
      return Promise.all(current).then(async (pending) => { current = await Promise.all(pending.map(async ({ row, matchesForJoin }) => ({ ...row, [value.as]: await matchesForJoin }))); return aggregateRows(current, pipeline.slice(pipeline.indexOf(stage) + 1)); });
    }
  }
  return current;
}

function stripMethods(record) {
  const copy = { ...record };
  delete copy.id;
  delete copy._id;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.save;
  delete copy.toObject;
  return copy;
}

function setPath(target, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const parent = parts.reduce((current, part) => {
    current[part] ??= {};
    return current[part];
  }, target);
  parent[last] = value;
}

function setPathWithArrayFilters(target, path, value, arrayFilters = []) {
  const parts = path.split('.');
  const filterIndex = parts.findIndex((part) => part.startsWith('$[') && part.endsWith(']'));
  if (filterIndex === -1) {
    setPath(target, path, value);
    return;
  }

  const filterName = parts[filterIndex].slice(2, -1);
  const arrayPath = parts.slice(0, filterIndex).join('.');
  const arrayValue = valueAt(target, arrayPath);
  if (!Array.isArray(arrayValue)) return;

  const filter = arrayFilters.find((item) => Object.keys(item).some((key) => key === filterName || key.startsWith(`${filterName}.`)));
  const filterExpression = filter
    ? Object.fromEntries(Object.entries(filter).map(([key, filterValue]) => [key.startsWith(`${filterName}.`) ? key.slice(filterName.length + 1) : key, filterValue]))
    : {};
  const remainingPath = parts.slice(filterIndex + 1).join('.');
  arrayValue.forEach((item) => {
    if (matches(item, filterExpression)) setPath(item, remainingPath, value);
  });
}

function deletePath(target, path) {
  const parts = path.split('.');
  const last = parts.pop();
  const parent = parts.reduce((current, part) => current?.[part], target);
  if (parent) delete parent[last];
}

function applyUpdate(data, update = {}, options = {}) {
  const next = { ...data };
  const direct = Object.fromEntries(Object.entries(update).filter(([key]) => !key.startsWith('$')));
  Object.entries(stripMethods(direct)).forEach(([path, value]) => {
    if (path.includes('.')) setPath(next, path, value);
    else next[path] = value;
  });
  Object.entries(update.$set || {}).forEach(([path, value]) => setPathWithArrayFilters(next, path, value, options.arrayFilters));
  Object.entries(update.$inc || {}).forEach(([path, value]) => setPath(next, path, Number(valueAt(next, path) || 0) + Number(value)));
  Object.entries(update.$push || {}).forEach(([path, value]) => {
    const current = valueAt(next, path);
    const values = value && typeof value === 'object' && Array.isArray(value.$each) ? value.$each : [value];
    setPath(next, path, [...(Array.isArray(current) ? current : []), ...values]);
  });
  Object.entries(update.$addToSet || {}).forEach(([path, value]) => {
    const current = Array.isArray(valueAt(next, path)) ? valueAt(next, path) : [];
    const values = value && typeof value === 'object' && Array.isArray(value.$each) ? value.$each : [value];
    const nextValues = [...current];
    values.forEach((item) => {
      if (!nextValues.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) nextValues.push(item);
    });
    setPath(next, path, nextValues);
  });
  Object.entries(update.$pull || {}).forEach(([path, condition]) => {
    const current = valueAt(next, path);
    if (!Array.isArray(current)) return;
    const matchesCondition = (item) => {
      if (item && typeof item === 'object' && !Array.isArray(item) && condition && typeof condition === 'object' && !Object.keys(condition).some((key) => key.startsWith('$'))) {
        return matches(item, condition);
      }
      return matches({ value: item }, { value: condition });
    };
    setPath(next, path, current.filter((item) => !matchesCondition(item)));
  });
  Object.keys(update.$unset || {}).forEach((path) => deletePath(next, path));
  if (options.isInsert) {
    Object.entries(update.$setOnInsert || {}).forEach(([path, value]) => setPath(next, path, value));
  }
  return next;
}

function projectFields(record, fields) {
  if (!fields) return record;
  const tokens = String(fields).split(/\s+/).filter(Boolean);
  const exclusions = tokens.filter((token) => token.startsWith('-')).map((token) => token.slice(1));
  if (exclusions.length) {
    const copy = { ...record };
    exclusions.forEach((path) => deletePath(copy, path));
    return copy;
  }
  const selected = { _id: record._id };
  tokens.forEach((path) => {
    const value = valueAt(record, path);
    if (value !== undefined) setPath(selected, path, value);
  });
  return selected;
}

async function populatePath(record, path, select) {
  const parts = path.split('.');
  const field = parts.pop();
  const parentPath = parts.join('.');
  const parents = parentPath ? valueAt(record, parentPath) : record;
  const values = Array.isArray(parents) ? parents : [parents];
  const modelName = relationModels[field] || relationModels[path];
  if (!modelName || !modelCache.has(modelName)) return record;
  const Model = modelCache.get(modelName);
  for (const parent of values) {
    if (!parent || parent[field] == null) continue;
    const ids = Array.isArray(parent[field]) ? parent[field] : [parent[field]];
    const populated = await Promise.all(ids.map((id) => Model.findById(id)));
    parent[field] = Array.isArray(parent[field])
      ? populated.map((item, index) => item || { _id: ids[index] })
      : (populated[0] || { _id: ids[0] });
    if (select && parent[field]) {
      parent[field] = Array.isArray(parent[field])
        ? parent[field].map((item) => projectFields(item, select))
        : projectFields(parent[field], select);
    }
  }
  return record;
}

function expose(instance) {
  if (!instance) return null;
  const record = { ...instance.dataValues.data, id: instance.dataValues.id };
  record._id = record.id;
  record.createdAt = instance.dataValues.createdAt;
  record.updatedAt = instance.dataValues.updatedAt;
  record.save = async () => {
    await instance.update({ data: stripMethods(record) });
    return expose(instance);
  };
  record.toObject = () => stripMethods(record);
  return record;
}

class Query {
  constructor(model, filter, single = false) {
    this.model = model;
    this.filter = filter || {};
    this.single = single;
    this.options = {};
    this.populateSpecs = [];
  }

  select(fields) { this.options.select = fields; return this; }
  lean() { return this; }
  populate(pathOrOptions, select) {
    if (typeof pathOrOptions === 'string') this.populateSpecs.push({ path: pathOrOptions, select });
    else if (pathOrOptions?.path) this.populateSpecs.push(pathOrOptions);
    return this;
  }
  sort(value) { this.options.sort = value; return this; }
  skip(value) { this.options.skip = value; return this; }
  limit(value) { this.options.limit = value; return this; }
  distinct(field) { this.options.distinct = field; return this; }
  async exec() {
    let result = (await this.model.findAll()).map(expose).filter((row) => matches(row, this.filter));
    for (const spec of this.populateSpecs) {
      for (const row of result) await populatePath(row, spec.path, spec.select || spec.select?.toString());
    }
    result = result.map((row) => projectFields(row, this.options.select));
    if (this.options.sort) {
      const entries = Object.entries(this.options.sort);
      result.sort((a, b) => {
        for (const [field, direction] of entries) {
          const left = valueAt(a, field); const right = valueAt(b, field);
          if (left === right) continue;
          return (left > right ? 1 : -1) * (Number(direction) || 1);
        }
        return 0;
      });
    }
    if (this.options.skip) result = result.slice(this.options.skip);
    if (this.options.limit != null) result = result.slice(0, this.options.limit);
    if (this.options.distinct) return [...new Set(result.map((row) => valueAt(row, this.options.distinct)))];
    return this.single ? (result[0] || null) : result;
  }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
}

class MutationQuery {
  constructor(executor) { this.executor = executor; }
  select() { return this; }
  lean() { return this; }
  populate() { return this; }
  then(resolve, reject) { return this.executor().then(resolve, reject); }
  catch(reject) { return this.executor().catch(reject); }
}

function createModel(name, tableName = name.toLowerCase() + 's') {
  if (modelCache.has(name)) return modelCache.get(name);
  const sequelizeModel = sequelize.define(tableName, {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  }, { tableName, timestamps: true, freezeTableName: true });
  const originalCreate = sequelizeModel.create.bind(sequelizeModel);

  sequelizeModel.find = (filter) => new Query(sequelizeModel, filter);
  sequelizeModel.findOne = (filter) => new Query(sequelizeModel, filter, true);
  sequelizeModel.findById = (id) => new Query(sequelizeModel, { _id: id }, true);
  sequelizeModel.exists = async (filter) => Boolean(await sequelizeModel.findOne(filter));
  sequelizeModel.countDocuments = async (filter) => (await sequelizeModel.find(filter)).length;
  sequelizeModel.create = async (values) => {
    const data = stripMethods(values);
    if (name === 'Admin') {
      data.isActive ??= true;
      data.failedLoginAttempts ??= 0;
      data.twoFactorEnabled ??= false;
      data.role ??= 'admin';
    }
    return expose(await originalCreate({ data }));
  };
  sequelizeModel.insertMany = async (values) => Promise.all(values.map((value) => sequelizeModel.create(value)));
  sequelizeModel.deleteOne = async (filter) => {
    const rows = await sequelizeModel.findAll();
    const matched = rows.filter((row) => matches(expose(row), filter));
    for (const row of matched) await row.destroy();
    return { deletedCount: matched.length };
  };
  sequelizeModel.deleteMany = async (filter) => {
    const rows = await sequelizeModel.findAll();
    const matched = rows.filter((row) => matches(expose(row), filter));
    for (const row of matched) await row.destroy();
    return { deletedCount: matched.length };
  };
  sequelizeModel.findByIdAndUpdate = (id, update, options = {}) => new MutationQuery(async () => {
    const [row] = await sequelizeModel.findAll({ where: { id } });
    if (!row) return null;
    await row.update({ data: applyUpdate(row.data, update, options) });
    return options.new === false ? null : expose(row);
  });
  sequelizeModel.findOneAndUpdate = (filter, update, options = {}) => new MutationQuery(async () => {
    const current = await sequelizeModel.findOne(filter);
    if (!current) {
      if (!options.upsert) return null;
      const equalityFilter = Object.fromEntries(Object.entries(filter).filter(([, value]) => !value || typeof value !== 'object' || Array.isArray(value)));
      return sequelizeModel.create({ ...equalityFilter, ...applyUpdate({}, update, { ...options, isInsert: true }) });
    }
    return await sequelizeModel.findByIdAndUpdate(current.id, update, options);
  });
  sequelizeModel.findOneAndDelete = (filter) => new MutationQuery(async () => {
    const current = await sequelizeModel.findOne(filter);
    if (!current) return null;
    await sequelizeModel.deleteOne({ _id: current.id });
    return current;
  });
  sequelizeModel.findByIdAndDelete = (id) => new MutationQuery(async () => {
    const current = await sequelizeModel.findById(id);
    if (!current) return null;
    await sequelizeModel.deleteOne({ _id: id });
    return current;
  });
  sequelizeModel.updateOne = async (filter, update) => {
    const row = await sequelizeModel.findOne(filter);
    if (!row) return { modifiedCount: 0 };
    await sequelizeModel.findByIdAndUpdate(row.id, update, { new: true });
    return { modifiedCount: 1 };
  };
  sequelizeModel.updateMany = async (filter, update) => {
    const rows = await sequelizeModel.findAll();
    const matched = rows.filter((row) => matches(expose(row), filter));
    for (const row of matched) {
      await row.update({ data: applyUpdate(row.data, update) });
    }
    return { modifiedCount: matched.length };
  };
  sequelizeModel.bulkWrite = async (operations = []) => {
    let modifiedCount = 0;
    for (const operation of operations) {
      if (operation?.updateOne) {
        const { filter, update, arrayFilters } = operation.updateOne;
        const row = await sequelizeModel.findOne(filter);
        if (!row) continue;
        await sequelizeModel.findByIdAndUpdate(row._id, update, { new: true, arrayFilters });
        modifiedCount += 1;
      }
    }
    return { modifiedCount };
  };
  sequelizeModel.aggregate = async (pipeline) => aggregateRows((await sequelizeModel.findAll()).map(expose), pipeline);
  modelCache.set(name, sequelizeModel);
  return sequelizeModel;
}

module.exports = { createModel, sequelize };