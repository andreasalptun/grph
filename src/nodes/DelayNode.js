const Node = require('../Node');

class DelayNode extends Node {
  constructor(config) {
    super(config, {
      plugs: 1,
      time: 1.0, // seconds
    }, 'plugs');

    this.initPlugs([this.plugs, '#time'], this.plugs);
    
    this.setProcessor('#time', (input, value) => {
      Node.log.info(this, `Setting delay time to ${value} second(s)`);
      this.time = value;
    });

    this.setProcessor('*', (input, value) => {
      Node.log.info(this, `wait for ${this.time} sec`);
      setTimeout(() => {
        this.output(input.index).send(value);
      }, 1000 * this.time);
    });
  }
}

module.exports = DelayNode;
