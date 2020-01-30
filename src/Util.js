const Node = require('./NodeDefs');

module.exports = {
  toBoolean(value) {
    if (!value)
      return Node.LOW;
    if (typeof(value) === 'number' && !Number.isNaN(value))
      return (value < 0.5 * (Node.LOW + Node.HIGH)) ? Node.LOW : Node.HIGH;
    return Node.HIGH;
  }
}
