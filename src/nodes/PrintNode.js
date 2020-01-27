const Node = require('../Node');

const chalk = require('chalk');

class PrintNode extends Node {
  constructor(config) {
    super(config, {
      inputPlugs: 1,
    });

    this.initPlugs(this.inputPlugs);

    this.setProcessor('*', (input, value) => {
      Node.log.print(this, `${input.name} received value ${value}`);
    });
  }
}

module.exports = PrintNode;
