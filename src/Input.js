const Plug = require('./Plug');
const Node = require('./NodeDefs');
const Logger = require('./Logger');

const matcher = require('matcher');

function findMatchingProcessor(input) {
  for (const processor of input.node.processors) {
    if (matcher.isMatch(input.name, processor[0]))
      return processor[1];
  }
}

class Input extends Plug {

  setTrigger(trigger) {
    if (trigger != Node.PULSE &&
      trigger != Node.RISE &&
      trigger != Node.FALL &&
      trigger != Node.CHANGE) {
      throw new TypeError('Trigger must be one of Node.{PULSE, RISE, FALL, CHANGE}');
    }
    this.trigger = trigger;
    return this;
  }

  receive(data, oldValue = Node.LOW) {

    if(typeof(data) === 'number') {
      data = {
        value: data
      }
    }
    
    if (typeof(data) === 'undefined') {
      data = {
        value: 1
      };
    }

    this._checkValue(data.value);

    if (!this.cachedProcessor) {
      this.cachedProcessor = findMatchingProcessor(this);

      if (typeof(this.cachedProcessor) !== 'object' || typeof(this.cachedProcessor.func) !== 'function') {
        throw new Error('No processor found for input plug named ' + this.name + ', has ' +
          (Array.from(this.node.processors.keys()).join(', ') || 'none'));
      }
    }

    const trig = this.trigger;
    if (!trig || trig == 'pulse' || // Default
      trig == 'change' && data.value != oldValue ||
      trig == 'rise' && data.value > oldValue ||
      trig == 'fall' && data.value < oldValue) {
      setImmediate(() => {
        Logger.debug(this.node, `Receive ${data.value} > ${this.desc}`);
        this.cachedProcessor.func(this, data);
      });
    }
  }
}

module.exports = Input;
