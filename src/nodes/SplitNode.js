const Node = require('../Node');

class SplitNode extends Node {
  constructor(config) {
    super(config, {
      outputPlugs: 2,
    });

    this.initPlugs('in', this.outputPlugs);

    this.setProcessor('in', (input, value) => {
      this.outputs.forEach(output => output.send(value));
    });
  }
}

module.exports = SplitNode;
