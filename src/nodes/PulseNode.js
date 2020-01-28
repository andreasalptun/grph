const Node = require('../Node');

class PulseNode extends Node {
  constructor(config) {
    super(config, {
      duration: 1.0, // seconds
      plugs: 1
    }, 'duration');

    // TODO force number
    this.initPlugs([this.plugs, '#duration'], this.plugs);

    this.setProcessor('#duration', (input, data)=>{
      Node.log.info(this, `duration = ${value} sec`);
      this.duration = value;
    });

    this.setProcessor('*', (input, data) => {

      Node.log.info(this, 'Pulse HIGH');

      this.output(input.index).send(Node.HIGH);

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.timeout = null;

        Node.log.info(this, 'Pulse LOW');

        this.output(input.index).send(Node.LOW);
      }, 1000 * this.duration);
    });
  }
}

module.exports = PulseNode;
