const Node = require('../../Node');
const Gpio = require('onoff').Gpio;

const toBoolean = require('to-boolean');

// {
//   inputPlugs: [{
//     outputPin: 6,
//   }],
//   outputPlugs: [{
//     name:'int0',
//     inputPin: 26,
//     interrupt: Node.RISE,
//   }]
// }

const edgeTbl = {
  [Node.RISE]: 'rising',
  [Node.FALL]: 'falling',
  [Node.CHANGE]: 'both',
};

class GpioNode extends Node {
  constructor(config) {
    super(config, {
      inputPlugs: {
        outputPin: 6,
      },
      outputPlugs: 1,
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
      afterParsingOutput: output => {
        if (typeof(output.inputPin) !== 'number') {
          throw new Error('Output plug missing required argument inputPin');
        }
        if (output.interrupt) {
          const edge = edgeTbl[output.interrupt];
          if (!edge) {
            throw new Error(`Invalid trigger, must be Node.{RISE,FALL,CHANGE}, was ${output.interrupt}`);
          }
          output.gpio = Gpio.accessible ?
            new Gpio(output.inputPin, 'in', edge) :
            new GpioMock(output.inputPin, output.interrupt);
        }
        return true;
      }
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

    this.startInterrupts();
  }

  startInterrupts() {
    if (!this.watchingInterrupts) {
      this.outputs
        .filter(output => output.gpio && output.interrupt)
        .forEach(output => {
          Node.log.info(this, `watching interrupts on ${output.name}`);
          output.gpio.watch((err, value) => {
            if (err) {
              Node.log.warn(this, err.message);
            } else {
              output.send(value);
            }
          });
        });
      this.watchingInterrupts = true;
    }
  }

  stopInterrupts() {
    if (this.watchingInterrupts) {
      this.outputs
        .filter(output => output.gpio && output.interrupt)
        .forEach(output => output.gpio.unwatchAll());
      this.watchingInterrupts = false;
    }
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
  constructor(pin, interrupt) {
    this.name = 'GpioNode-Mock';
    this.pin = pin;
    this.interrupt = interrupt;
    this.interruptValue = 0;
    Node.log.warn(this, 'gpio not accessible');
  }
  watch(fn) {
    if (toBoolean(process.env.RPI_GPIO_SIMULATE_INTERRUPTS)) {
      setInterval(() => {
        this.interruptValue = 1 - this.interruptValue;
        if (this.interrupt == Node.RISE && this.interruptValue == 1 ||
          this.interrupt == Node.FALL && this.interruptValue == 0 ||
          this.interrupt == Node.CHANGE) {
          Node.log.info(this, `simulated interrupt ${this.interrupt} on pin ${this.pin}`);
          fn(null, this.interruptValue);
        }
      }, 2000);
    }
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
