const grph = require("grph")

grph.Logger.setLevel(grph.Logger.INFO);

// Create nodes
const delay = new grph.DelayNode(2.5); // seconds
const print = new grph.PrintNode(); // just print to console

// Connect nodes
delay.output().connectTo(print.input());

// Run
delay.input().receive({value:123})
