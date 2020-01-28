const Node = require('../Node');

const chalk = require('chalk');

class PrintNode extends Node {
  constructor(config) {
    super(config, {
      inputPlugs: 1,
    });

    this.initPlugs(this.inputPlugs);

    this.setProcessor('*', (input, data) => {
      Node.log.print(this, `${input.name} received value ${data.value}`);
    });
  }
}

module.exports = PrintNode;
