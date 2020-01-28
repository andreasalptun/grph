const express = require('express');

const grph = require('./index');

const delay = new grph.DelayNode();
// const schedule = new grph.ScheduleNode('*/3 * * * * *');
const printer = new grph.PrintNode();
// const pulse = new grph.PulseNode({
//   plugs: ['water-heater', 'tho']
// });

const app = express();

grph.Logger.setLevel('HttpNode', grph.Logger.DEBUG);

app.listen(process.env.HTTP_LISTEN_PORT, process.env.HTTP_LISTEN_ADDR, async () => {
  console.log(`Server listening on http://${process.env.HTTP_LISTEN_ADDR}:${process.env.HTTP_LISTEN_PORT}`);

  const request = new grph.HttpNode(app, {
    route: '/api/v1/syno/:plug/:value?',
    plugs: ['set-home', {
      name: 'get-home',
      hasResponseInput: true
    }]
  });
  // 
  // const state = new Graph.SynoStateNode();
  // 
  // const print = new Graph.PrintNode();
  // 
  // request.output('set-home').connectTo(state.input('set-home'));
  // request.output('get-home').connectTo(state.input('>home'));
  // state.output('home').connectTo(print.input());
  
  request.output('get-home').connectTo(delay.input());
  delay.output().setFilter(valu<e=>2*value).connectTo(request.input());
});


// let count = 0;
// schedule
//   .output()
//   .setFilter(value => count < 5 ? value : null)
//   .connectTo(pulse.input());
// pulse.output().connectTo(printer.input());




// delay.input().receive(1);

// delay.output().disconnect();


// 
// Node.setVerbosityLevel(Node.INFO);
// 
// 
// const delay = new DelayNode();
// // delay.input().trigger = Node.RISE;
// 
// 
// 
// const splitter = new SplitNode(3);
// const printer = new PrintNode('DelayTest');
// 
// delay.output().connectTo(splitter.input());
// // splitter.output(0).connectTo(delay.input('#time'))
// splitter.output(1).connectTo(printer.input())
// splitter.output(2).setFilter('boolean-invert').connectTo(delay.input().setTrigger(Node.CHANGE))
// 
// // 
// // // delay.input('#time').receive(3.7);
// // 
// // console.log(delay.input().shouldReceive(0,0));
// delay.input().receive(1);

// const Node = require('./backend/src/nodes/Node');
// const HttpNode = require('./nodes/HttpNode');
// Node.verbose = true;


// node.createPins(null, {name:'OUTPUT0'});
// console.log(node.parsePinDefs([3, '+rising', {name:'lcd',count:8}, {name:'enable'},1], Node.INPUT));
// console.log(node.parsePinDefs([3, '@pushed', '!inverted', 3, {name:'object', trigger:'rise'},1], Node.OUTPUT));

// console.log(node.parsePinDefs(Node.INPUT, '@pushed', '!inverted'));





// const express = require('express');
// 
// const app = express();
// 
// app.listen(process.env.HTTP_LISTEN_PORT, process.env.HTTP_LISTEN_ADDR, async () => {
//   console.log(`Snitch server listening on http://${process.env.HTTP_LISTEN_ADDR}:${process.env.HTTP_LISTEN_PORT}`);
// 
//   let h = new HttpNode(app, {
//     plugs: {
//       name: 'test',
//       responseInput: true
//     }
//   });
// 
//   h.output().connectTo(h.input());
// 
// });






// let p = new PrintNode(2);
// 
// 
// p.input('in0').receive(1);
// p.input('in1').receive(2);

// p.inputs.forEach(i=>console.log(i));
// 
// p.setProcessor('*', (input,value)=>{
// 
// })
// p.inputs.forEach(i=>console.log(i));
// 
// p.input(0).receive(2);
// 
// p.inputs.forEach(i=>console.log(i));

// let node1 = new Node();
// node1.createPins(null, {name:'@pushed',inverted:true});
// 
// let node2 = new Node();
// node2.createPins(['my-input',2], null);
// 
// console.log(node1.output('pushed'));
// node1.output('pushed').connectTo(node2.input('my-input'));
// 
// node1.input('>pushed').receive(1);
