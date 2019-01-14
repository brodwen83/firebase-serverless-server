/**
 * @description   Returns a boolean if @param{value} is empty, undefined, null
 * @param {value} value a string or object
 */
const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === "object" && Object.keys(value).length === 0) ||
  (typeof value === "string" && value.trim().length === 0);

module.exports = isEmpty;
