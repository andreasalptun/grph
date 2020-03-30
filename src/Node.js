const Input = require('./Input');
const Output = require('./Output');
const Util = require('./Util');
const Logger = require('./Logger');

const intersectObjects = require('intersect-objects').default;
const deepCopy = require('deep-copy');
const blacklist = require('blacklist');

function checkType(type) {
  if (![Node.INPUT, Node.OUTPUT].includes(type)) {
    throw new Error('Argument type must be Node.INPUT or Node.OUTPUT.');
  }
}

function parsePlugs(type, defaultName, ...plugs) {
  checkType(type);

  function unroll(array, entry) {
    if (typeof(entry) === 'string') {
      return array.concat({
        name: entry
      });
    }

    let count, attrs,
      start = array.length,
      name = defaultName.toString();

    if (typeof(entry) === 'number') {
      count = entry;
    } else if (typeof(entry) === 'object') {

      if (entry.name && entry.name != name) {
        name = entry.name;
        start = 0;
      }
      count = entry.count;
      attrs = blacklist(entry, 'count', 'name');

      if (typeof(count) !== 'number') {
        return array.concat(Object.assign({
          name
        }, attrs));
      }
    } else {
      throw new TypeError(`Plug config must be (array of) string, number or object, was ${typeof(entry)}`);
    }

    return array.concat(
      Array.apply(null, Array(count)).map((_, i) => Object.assign({
        name: name + (start + i)
      }, attrs))
    );
  }

  // // Print parsed plugs
  // console.log(plugs.reduce((array, entry) => array.concat(entry), []) // Merge arguments
  //   .filter(entry => entry) // Remove null entries
  //   .reduce(unroll, [])
  // );

  return deepCopy(plugs
    .reduce((array, entry) => array.concat(entry), []) // Merge arguments
    .filter(entry => entry) // Remove null entries
    .reduce(unroll, []));
}

function findPlug(node, type, name = 0) {
  checkType(type);
  let index;
  const plugs = node[type.key];

  if (typeof(plugs) === 'undefined')
    throw new Error(`${this.name}: Plugs not initialized.`);

  if (typeof(name) === 'string' && name) {
    index = plugs.findIndex(plug => plug.name == name);
    if (index < 0) {
      throw new RangeError(`${type.name} named \'${name}\' not found.`);
    }
  } else if (typeof(name) === 'number') {
    index = name;
    if (index < 0 || index >= plugs.length) {
      throw new RangeError(`${type.name} with index ${name} out of range.`);
    }
  } else {
    throw new Error(`${type.name} not found. Argument must be string or number, was ${typeof(name)}.`);
  }

  return plugs[index];
}

class Node {

  constructor(config = {}, defaultConfig = {}, defaultKey) {
    this.name = this.constructor.name;
    this.processors = new Map();

    if (typeof(defaultConfig) !== 'object') {
      throw new Error(`Invalid default config. Second argument must be an object, was ${typeof(config)}.`);
    }
    if (typeof(config) !== 'object' || Array.isArray(config)) {
      if (typeof(defaultKey) === 'undefined') {

        // If default config only contains one key, use it as the default key
        const defaultConfigKeys = Object.keys(defaultConfig);
        if (defaultConfigKeys.length == 1) {
          defaultKey = defaultConfigKeys[0];
        }
      }
      if (typeof(defaultKey) !== 'string') {
        throw new Error(`Invalid or missing default config key. Third argument must be a string, was ${typeof(defaultKey)}.`);
      }
      if (typeof(defaultConfig[defaultKey]) === 'undefined') {
        throw new Error(`Default config key not found in default config, was ${defaultKey}.`);
      }

      // If non-object argument, set as default property in config object
      config = {
        [defaultKey]: config
      }
    }

    // Merge config into this
    Object.assign(this,
      defaultConfig,
      intersectObjects(defaultConfig, config));
  }

  // Each param can be a number (unnamed plugs), a string (name) an object*
  // or an array of strings (names) and objects*
  // (*) object must have a name and can have data (userdata) or,
  // if input, trigger (poke/change/rise/fall) 

  initPlugs(inputs, outputs, opt = {}) { // TODO rename to plugs

    outputs = parsePlugs(
      Node.OUTPUT,
      opt.defaultOutputName || opt.defaultName || 'out',
      outputs);

    // Let subnode modify outputs after parsing 
    if (typeof(opt.afterParsingOutput) === 'function') {
      outputs = outputs.filter(opt.afterParsingOutput);
    }

    // Set pushed if node name starts with @
    outputs
      .filter(output => output.name.startsWith('@'))
      .forEach(output => {
        output.name = output.name.substring(1);
        output.pushed = true;
      });

    const pushInputs = outputs
      .filter(output => output.pushed)
      .map(output => {
        return {
          name: '>' + output.name,
          pushOutputName: output.name,
          pushed: true,
        }
      });

    inputs = parsePlugs(
      Node.INPUT,
      opt.defaultInputName || opt.defaultName || 'in',
      inputs,
      pushInputs);

    // Let subnode modify inputs after parsing 
    if (typeof(opt.afterParsingInput) === 'function') {
      inputs = inputs.filter(opt.afterParsingInput);
    }

    // Crete Input/Output objects
    this.inputs = inputs.map((args, i) => new Input(args, i, this));
    this.outputs = outputs.map((args, i) => new Output(args, i, this));

    if (inputs.length > 0)
      Logger.info(this, 'input plugs (' + (inputs.map(input => input.name).join(', ') || '-') + ')');
    if (outputs.length > 0)
      Logger.info(this, 'output plugs (' + (outputs.map(output => output.name).join(', ') || '-') + ')');

    if (!inputs.length && !outputs.length)
      Logger.warn(this, 'no plugs');
  }

  setProcessor(pattern, processor) {
    this.processors.set(pattern, {
      func: processor
    });
    // Invalidate input caches
    this.inputs.forEach(input => input.cachedProcessor = null);
  }

  output(name) {
    return findPlug(this, Node.OUTPUT, name);
  }

  input(name) {
    return findPlug(this, Node.INPUT, name);
  }

  // sendTo(index, value) {
  //   this.output(index).send(value);
  // }

  receiveFrom(index, name, value) { // virtual
    throw new Error("Method receiveFrom not implemented in subclass");
  }

  get inputCount() {
    return this.inputs.length;
  }

  get outputCount() {
    return this.outputs.length;
  }

  onConnected(outputNode, outputIndex, inputIndex) { // virtual
    // console.log('onConnected', outputNode.name, outputIndex, inputIndex);
  }

  onDisconnected(outputNode, outputIndex, inputIndex) { // virtual
    // console.log('onDisconnected', outputNode.name, outputIndex, inputIndex);
  }
}

// Mixin NodeDefs and Util+Logger for convenience
Object.assign(Node, require('./NodeDefs'), {
  log: Logger,
  util: Util,
});

module.exports = Node;
