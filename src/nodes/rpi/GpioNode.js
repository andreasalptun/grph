const Node = require('../../Node');
const Gpio = require('onoff').Gpio;

// {
//   inputPlugs: [{
//     gpio: 6,
//   }],
//   outputPlugs: [{
//     gpio: 26,
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
          if (typeof(input.gpio) !== 'number') {
            throw new Error('Input plug missing required argument gpio');
          }
          input._gpio = Gpio.accessible ?
          new Gpio(input.gpio, Node.util.toBoolean(input.initValue) ? 'high' : 'low') :
          new GpioMock(input.gpio);
          delete input.initValue;
        }
        return true;
      },
      afterParsingOutput: output => {
        if (typeof(output.gpio) !== 'number') {
          throw new Error('Output plug missing required argument gpio');
        }
        if (output.interrupt) {
          const edge = edgeTbl[output.interrupt];
          if (!edge) {
            throw new Error(`Invalid trigger, must be Node.{RISE,FALL,CHANGE}, was ${output.interrupt}`);
          }
          output._gpio = Gpio.accessible ?
            new Gpio(output.gpio, 'in', edge) :
            new GpioMock(output.gpio, output.interrupt);
        }
        else {
          output._gpio = Gpio.accessible ?
            new Gpio(output.gpio, 'in') :
            new GpioMock(output.gpio);
          output.pushed = true;
        }
        return true;
      }
    });

    this.setProcessor(Node.PUSHED, async (input, data) => {
      try {
        const pushOutput = this.output(input.pushOutputName);
        const value = Node.util.toBoolean(await pushOutput._gpio.read());
        Node.log.info(this, `GPIO${pushOutput.gpio} > ${value} > ${pushOutput.desc} (pushed)`)
        pushOutput.send(value);
      } catch(e) {
        Node.log.error(this, e.message);
      }
    });
    
    this.setProcessor(Node.CATCH, async (input, data) => {
      const value = Node.util.toBoolean(data.value);
      Node.log.info(this, `${input.desc} > ${value} > GPIO${input.gpio}`)
      try {
        await input._gpio.write(value);
      } catch (e) {
        Node.log.error(this, e.message);
      }
    });
    
    this.startInterrupts();
  }

  startInterrupts() {
    if (!this.watchingInterrupts) {
      this.outputs
        .filter(output => output._gpio && output.interrupt)
        .forEach(output => {
          Node.log.info(this, `watching interrupts on GPIO${output.gpio} for output ${output.name}`);
          output._gpio.watch((err, value) => {
            if (err) {
              Node.log.warn(this, err.message);
            } else {
              Node.log.info(this, `GPIO${output.gpio} > ${value} > ${output.desc} (interrupt)`)
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
        .filter(output => output._gpio && output.interrupt)
        .forEach(output => output._gpio.unwatchAll());
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
    const stringToBoolean = require('to-boolean');

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

