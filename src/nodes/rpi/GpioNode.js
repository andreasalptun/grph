const Node = require('../../Node');
const Gpio = require('onoff').Gpio;

const stringToBoolean = require('to-boolean');

// {
//   inputPlugs: [{
//     outputPin: 6,
//   }],
//   outputPlugs: [{
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
      inputPlugs: 0,
      outputPlugs: 0,
    });

    this.initPlugs(this.inputPlugs, this.outputPlugs, {
      afterParsingInput: input => {
        if(!input.pushed) {
          if (typeof(input.outputPin) !== 'number') {
            throw new Error('Input plug missing required argument outputPin');
          }
          input.gpio = Gpio.accessible ?
          new Gpio(input.outputPin, Node.util.toBoolean(input.initValue) ? 'high' : 'low') :
          new GpioMock(input.outputPin);
          delete input.initValue;
        }
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
        else {
          output.gpio = Gpio.accessible ?
            new Gpio(output.inputPin, 'in') :
            new GpioMock(output.inputPin);
          output.pushed = true;
        }
        return true;
      }
    });

    this.setProcessor(Node.PUSHED, async (input, data) => {
      try {
        const pushOutput = this.output(input.pushOutputName);
        const value = Node.util.toBoolean(await pushOutput.gpio.read());
        Node.log.info(this, `push gpio[${pushOutput.inputPin}]:${value} > ${input.desc}`)
        pushOutput.send(value);
      } catch(e) {
        Node.log.error(this, e.message);
      }
    });
    
    this.setProcessor(Node.CATCH, async (input, data) => {
      const value = Node.util.toBoolean(data.value);
      Node.log.info(this, `${input.desc}:${value} > gpio[${input.outputPin}]`)
      try {
        await input.gpio.write(value);
      } catch (e) {
        Node.log.error(this, e.message);
      }
    });
    
    this.startInterrupts();
  }

  startInterrupts() {
    if (!this.watchingInterrupts) {
      this.outputs
        .filter(output => output.gpio && output.interrupt)
        .forEach(output => {
          Node.log.info(this, `watching interrupts on gpio[${output.inputPin}] for output ${output.name}`);
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
}

class GpioMock {
  constructor(pin, interrupt) {
    this.name = 'GpioNode-Mock';
    this.pin = pin;
    this.interrupt = interrupt;
    this.interruptValue = 1;
    this.readValue = 1;
    Node.log.warn(this, 'gpio not accessible');
  }
  watch(fn) {
    if (stringToBoolean(process.env.RPI_GPIO_SIMULATE_INTERRUPTS || '')) {
      setInterval(() => {
        if (this.interrupt == Node.RISE && this.interruptValue == 1 ||
          this.interrupt == Node.FALL && this.interruptValue == 0 ||
          this.interrupt == Node.CHANGE) {
          Node.log.info(this, `simulated interrupt ${this.interrupt} on pin ${this.pin}`);
          fn(null, this.interruptValue);
        }
        this.interruptValue = 1 - this.interruptValue;
      }, 2000);
    }
  }
  async read() {
    const value = this.readValue;
    Node.log.info(this, `simulated read ${value} from pin ${this.pin}`);
    this.readValue = 1 - this.readValue;
    return value;
  }
  async write(value) {
    Node.log.info(this, `simulated write ${value} to pin ${this.pin}`);
  };
}

module.exports = GpioNode;
