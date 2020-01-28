const Node = require('../Node');

class DelayNode extends Node {
  constructor(config) {
    super(config, {
      plugs: 1,
      time: 1.0, // seconds
    }, 'plugs');

    this.initPlugs([this.plugs, '#time'], this.plugs);
    
    this.setProcessor('#time', (input, data) => {
      Node.log.info(this, `time = ${data.value} sec`);
      this.time = data.value;
    });

    this.setProcessor('*', (input, data) => {
      Node.log.info(this, `wait for ${this.time} sec`);
      setTimeout(() => {
        this.output(input.index).send(data);
      }, 1000 * this.time);
    });
  }
}

module.exports = DelayNode;
