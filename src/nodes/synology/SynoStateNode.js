const Node = require('../../Node');
const Synology = require('./SynoSession');

class SynoStateNode extends Node {
  constructor(config) {
    super();
    this.initPlugs('set-home', '@is-home');

    this.setProcessor('>is-home', async (input) => {
      try {
        const body = await Synology.request('/entry.cgi?api=SYNO.SurveillanceStation.HomeMode&version=1&method=GetInfo');
        this.output('is-home').send(body.data.on ? Node.HIGH : Node.LOW);
      } catch (e) {
        Node.log.error(this, e.message);
      }
    });

    this.setProcessor('set-home', async (input, data) => {
      try {
        const home = !!data.value;
        let b = await Synology.request('/entry.cgi?api=SYNO.SurveillanceStation.HomeMode&version=1&method=Switch&on=' + home);
        this.output('is-home').send(home ? Node.HIGH : Node.LOW);
      } catch (e) {
        Node.log.error(this, e.message);
      }
    });
  }
}

module.exports = {
  SynoStateNode,
}
