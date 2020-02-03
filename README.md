# grph.dev

Graph programming. Create node.js or browser apps by connecting graph nodes. Use standard nodes or easily create your own.

_This repo is work in progress, but feel free to check it out and [contact me](mailto:andreas@grph.dev) for questions or requests!_

## The Node essentials

Any node's output plug can be connected to any node's input plug. The signal propagated through the graph is mainly a single number, but can also carry other types of data.

The signal data is computed by one of the internal processors. The signal data can optionally be filtered through a standard or user-defined filter function before passed on to, and stored in, the output plug.

Each input can trigger a processor on a `pulse` (any signal), `rise` (signal value increase, e.g. 0->1), `fall` (signal value decrease) or `change`.

```txt
input plugs                              output plugs
     .----------------------------------------.
     |                  Node                  |
     |                                        |
    [0]--{trigger}--[processor0]------------[data]
     |                        '-------------[data]
     |                                        |
    [a]--{trigger}--[processor1]--<filter>--[data]
    [b]--{trigger}---'                        |
     |                                        |
     '----------------------------------------'
```

## A useless example

The following example is quite useless, but the important part this far is how the nodes work; definitions, configuration, connections, processing and signal propagation. More useful nodes are coming. 

My personal use-case is to create a modular app running on a raspberry pi to smartify my home, but the architecture is very open and one could easily create its own custom nodes and use it for anything, really.

```js
const grph = require('grph');

grph.Logger.setLevel(grph.Logger.INFO);

// Create nodes
const request = new grph.HttpNode(app, { // <= express app
  route: '/api/:plug/:value',
  plugs: {
    name:'calc-square',
    response: true // create an input for the response
  }  
});
const delay = new grph.DelayNode(2.5); // seconds
const split = new grph.SplitNode(2); // two outputs
const print = new grph.PrintNode(); // just print to console

// Connect nodes
//      .---------.    .-------.      .-------.    .-------.
//  .-->| request |--->| split |----->| delay |--->| print |
//  |   '---------'    |       |---.  '-------'    '-------'
//  |                  '-------'   |
//  |                              |
//  '--------------< x² filter >---'


request.output('calc-square').connectTo(split.input());
split.output(0).connectTo(delay.input());
split.output(1).setFilter(value => value*value).connectTo(request.input());
delay.output().connectTo(print.input());
```

Test it with something like `curl localhost:8080/api/calc-square/3` (depending on your server setup). It should respond with `{value:9}` immediately and then print the request value to the console after a 2.5 second delay.

### How to run the attached example

`node -r dotenv/config test.js`

Make sure to create your own `.env` file in the module root with contents:

```dotenv
HTTP_LISTEN_PORT=8080
HTTP_LISTEN_ADDR=localhost
```

Then run `curl localhost:8080/api/v1/set-pulse-duration/6` or `curl localhost:8080/api/v1/multiply-2/123`.

### More to come..

so be sure to check back later!
