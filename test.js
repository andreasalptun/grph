const express = require('express');
const grph = require('./index');

const app = express();

grph.Logger.setLevel(grph.Logger.INFO);

app.listen(process.env.HTTP_LISTEN_PORT, process.env.HTTP_LISTEN_ADDR, async () => {
  console.log(`Server listening on http://${process.env.HTTP_LISTEN_ADDR}:${process.env.HTTP_LISTEN_PORT}`);

  const delayer = new grph.DelayNode();
  const scheduler = new grph.ScheduleNode('*/5 * * * * *');
  const splitter = new grph.SplitNode(3);
  const printer = new grph.PrintNode(['scheduler', 'inv scheduler', 'pulse']);
  const pulser = new grph.PulseNode({
    duration: 2,
    plugs: 'trig',
  });
  const request = new grph.HttpNode(app, {
    route: '/api/v1/:plug/:value?',
    plugs: ['set-pulse-duration', {
      name: 'multiply-2',
      hasResponseInput: true
    }]
  });
  
  // These tests dont actually do anything, just as an example
  //
  
  // Test standard modules and timing
  scheduler.output().connectTo(splitter.input());
  splitter.output(0).connectTo(printer.input('scheduler'));
  splitter.output(1).setFilter('boolean-invert').connectTo(printer.input('inv scheduler'));
  splitter.output(2).connectTo(pulser.input('trig'));
  pulser.output().connectTo(printer.input('pulse'));
  
  // Test networking
  request.output('set-pulse-duration').connectTo(pulser.input('#duration'));
  request.output('multiply-2').connectTo(delayer.input()); // delay just for show
  delayer.output().setFilter(value=>value*2).connectTo(request.input('multiply-2-response'));
});

// Run: 
// curl localhost:8080/api/v1/set-pulse-duration/6
// or
// curl localhost:8080/api/v1/multiply-2/123
