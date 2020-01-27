const Plug = require('./Plug');
const Node = require('./NodeDefs');
const Logger = require('./Logger');

const standardFilters = {
  // No arrow functions here to be able to use output object as this
  'pass-through': function(value) {
    return value;
  },
  'boolean-invert': function(value) {
    return (value < 0.5 * (Node.LOW + Node.HIGH)) ? Node.HIGH : Node.LOW;
  }
}

class Output extends Plug {
  constructor(config, index, node) {
    super(config, index, node);
    this.value = Node.LOW;
    this.filter = standardFilters['pass-through'];
    this.connectedTo = null;
  }

  setValue(initValue) {
    if (typeof(initValue) !== 'number')
      throw new TypeError('Value must be a number');
    this.value = this.filter(initValue);
    return this;
  }

  setFilter(filter, initValue) {
    if (typeof(filter) === 'function') {
      this.filter = filter;
    } else if (typeof(filter) === 'string') {
      this.filter = standardFilters[filter];
      if (typeof(this.filter) !== 'function') {
        throw new Error(`Filter \'${filter}\' does not exist. Available standard filters: ${Object.keys(standardFilters).join(',')}`);
      }
    } else if (!filter) {
      this.filter = standardFilters['pass-through'];
    } else {
      throw new TypeError(`Filter must be a function, string or falsy, was ${typeof(filter)}`);
    }
    this.setValue(initValue || Node.LOW);
    return this;
  }

  send(value) {
    if (typeof(value) !== 'number' || Number.isNaN(value)) {
      throw new TypeError(`Output value must be a number, was ${typeof(value)}`);
    }

    // TODO throw error if input name starts with > in superclass
    const oldValue = this.value;
    const newValue = this.value = this.filter(value);
    if (this.connectedTo && typeof(newValue) === 'number') {
      if (this.connectedTo.name.startsWith('>')) {
        this.connectedTo.push(); //?
      } else {
        Logger.debug(this.node, `Send ${this.desc}] > ${newValue} > ${this.connectedTo.desc}`);
        this.connectedTo.receive(oldValue, newValue);
      }
    }
  }

  connectTo(input) {
    if (Array.isArray(input))
      throw new TypeError('Unable to connect to array, use outputs().connectTo([])');

    this.disconnect();
    this.connectedTo = input;
    Logger.info(this.node, `connect ${this.desc} -> ${input.desc}`);
    // input.node.onConnected(this.node, this.index, input.index);

    return this.node;
  }
  disconnect() {
    if (this.connectedTo) {
      const currentInput = this.connectedTo;
      this.connectedTo = null;
      Logger.info(this.node, `disconnect ${this.desc} -X ${currentInput.desc}`);
      // currentInput.node.onDisconnected(this.node, this.index, currentInput.index);
    }
  }
}

module.exports = Output;
