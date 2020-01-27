const Input = require('./Input');
const Output = require('./Output');
const Logger = require('./Logger');

const intersectObjects = require('intersect-objects').default;

function checkType(type) {
  if (![Node.INPUT, Node.OUTPUT].includes(type)) {
    throw new Error('Argument type must be Node.INPUT or Node.OUTPUT.');
  }
}

function parsePlugs(type, defaultName, ...plugs) {
  checkType(type);

  function unrollNumerals(array, entry) {
    let count,
      start = array.length,
      name = defaultName.toString();
    if (typeof(entry) === 'number') {
      count = entry;
    } else if (typeof(entry) === 'object' && 'count' in entry) {
      count = entry.count;
      name = entry.name;
      start = 0;
    }
    return array.concat(typeof(count) === 'number' ?
      Array.apply(null, Array(count)).map((_, i) => name + (start + i)) : entry);
  }

  function objectifyStrings(entry) {
    return typeof(entry) === 'string' ? {
      name: entry
    } : entry;
  }

  // function resolveModifiers(entry) {
  //   const modifierObj = MODIFIERS.get(type)[entry.name.charAt(0)];
  //   if (typeof(modifierObj) !== 'undefined') {
  //     entry.name = entry.name.substring(1);
  //     return Object.assign(entry, modifierObj);
  //   }
  //   return entry;
  // }

  return plugs
    .reduce((array, entry) => array.concat(entry), []) // Merge arguments
    .filter(entry => entry) // Remove null entries
    .reduce(unrollNumerals, []) // Unroll numerals
    .map(objectifyStrings) // Objectify strings
  // .map(resolveModifiers); // Resolve modifiers
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
    throw new Error(`${type.name} pin not found. Argument must be string or number, was ${typeof(name)}.`);
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

  // Each param can be a number (unnamed pins), a string (name) an object*
  // or an array of strings (names) and objects*
  // (*) object must have a name and can have data (userdata) or,
  // if input, trigger (poke/change/rise/fall) 

  initPlugs(inputs, outputs, opt = {}) { // TODO rename to plugs
    // function cloneArrayObjects(array) {
    //   if (Array.isArray(array)) {
    //     return array.map(function(entry) {
    //       if (typeof(entry) === 'object')
    //         return Object.assign({}, entry);
    //       return entry;
    //     });
    //   }
    //   return array;
    // }

    outputs = parsePlugs(
      Node.OUTPUT,
      opt.outputName || 'out',
      // cloneArrayObjects(outputs));
      outputs);

    if (typeof(opt.modifyOutput) === 'function') {
      inputs.forEach(opt.modifyOutput);
    }

    const pushInputs = outputs
      .filter(output => output.pushed)
      .map(output => {
        return {
          name: '>' + output.name,
          pushOutput: output,
          pushed: true,
        }
      });

    inputs = parsePlugs(
      Node.INPUT,
      opt.inputName || 'in',
      // cloneArrayObjects(inputs),
      inputs,
      pushInputs);

    if (typeof(opt.modifyInput) === 'function') {
      inputs.forEach(opt.modifyInput);
    }

    this.inputs = inputs.map((args, i) => new Input(args, i, this));
    this.outputs = outputs.map((args, i) => new Output(args, i, this));

    Logger.info(this, 'in (' +
      (inputs.map(input => input.name).join(', ') || '-') + '), out (' +
      (outputs.map(output => output.name).join(', ') || '-') + ')');
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

// Mixin NodeDefs and Logger for convenience
Object.assign(Node, require('./NodeDefs'), {
  log: Logger
});

module.exports = Node;
