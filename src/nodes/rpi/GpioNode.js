const Node = require('../../Node');
const Gpio = require('onoff').Gpio;

// {
//   inputPlugs: [{
//     outputPin: 6,
//   }],
//   outputPlugs: [{
//     name:'int0',
//     inputPin: 26,
//     trigger: Node.CHANGE,
//   }]
// }

class GpioNode extends Node {
  constructor(config) {
    super(config, {
      inputPlugs: {
        outputPin: 6,
      },
    });

    this.initPlugs(this.inputPlugs, this.outputPlugs, {
      afterParsingInput: input => {
        if (typeof(input.outputPin) !== 'number') {
          throw new Error('Input plug missing required argument outputPin');
        }
        input.gpio = Gpio.accessible ?
          new Gpio(input.outputPin, Node.util.toBoolean(input.initValue) ? 'high' : 'low') :
          new GpioMock(input.outputPin);
        delete input.initValue;
        return true;
      }, 
    });

    // const pushInputs = this.config.outputs && this.config.outputs
    //   .filter(output => !output.type || output.type == 'pushed')
    //   .map(output => '>' + output.name);
    // 

    this.setProcessor('*', async (input, data) => {
      const outputValue = Node.util.toBoolean(data.value);
      Node.log.info(this, `${outputValue} > gpio(${input.outputPin})`)
      try {
        await input.gpio.write(outputValue);
      } catch (e) {
        Node.log.error(this, e.message, e);
      }
    });

  }

  // receiveFrom(index, name, value) {
  // 
  //   // Push input, read value from hw input and push to output
  //   if (name.startsWith('>')) {
  //     setImmediate(async () => {
  //       const output = this.output(name.substring(1));
  //       console.log(`${this.name}(${name||index}): Pushing input gpio(${this.config.outputs[output.index].inputHwPin}) to output`);
  //       try {
  //         output.send(await output.data.gpio.read());
  //       } catch (e) {
  //         console.warn(e.message);
  //         console.error(e);
  //       }
  //     });
  //   }
  // 
  //   // Standard input, write value to hw output
  //   else {
  //     setImmediate(async () => {
  //       console.log(`${this.name}(${name||index}): Setting output gpio(${this.config.inputs[index].outputHwPin}) to ${value>0.5?'high':'low'}`);
  //       try {
  //         await this.inputs[index].data.gpio.write(value > 0.5 ? Gpio.HIGH : Gpio.LOW);
  //       } catch (e) {
  //         console.warn(e.message);
  //         console.error(e);
  //       }
  //     });
  //   }
  // }
}

class GpioMock {
  constructor(pin) {
    this.name = 'GpioNode-Mock';
    this.pin = pin;
    Node.log.warn(this, 'gpio not accessible');
  }
  async read() {
    console.log('GpioMock: Read');
    return 1;
  }
  async write(value) {
    Node.log.info(this, `simulated write ${value} to pin ${this.pin}`);
  };
}

module.exports = GpioNode;
