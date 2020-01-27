const Node = require('../Node');

const cron = require('cron');

class ScheduleNode extends Node {
  constructor(config) {
    super(config, {
      schedule: '* * * * * *' // cron-string or Date object, see https://www.npmjs.com/package/cron
    });

    this.initPlugs(null, 1);

    this.job = cron.job(this.schedule, () => {
      Node.log.info(this, 'Send pulse')
      this.output().send(1)
    }, null, true);
  }
}

module.exports = ScheduleNode;
