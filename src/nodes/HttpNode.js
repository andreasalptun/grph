const Node = require('../Node');

// route: (/api/:output/:value)
// outputs: ('default') or {name:'my-endpoint', responseInput:true}

class HttpNode extends Node {
  constructor(app, config) {
    super(config, {
      route: '/api/:plug/:value?',
      plugs: 1 // 'request0'
    });

    Node.log.info(this, 'route ' + this.route);

    this.initPlugs(this.plugs, this.plugs, {
      defaultName: 'request',
      afterParsingInput: input => {
        if (input.hasResponseInput) {
          input.requestOutputName = input.name;
          input.name += '-response';
          delete input.hasResponseInput;
          return true;
        }
      }
    });

    this.setProcessor('*-response', (input, data) => {
      const output = this.output(input.requestOutputName);
      if (output && typeof(data.res) === 'object') {
        const body = {
          value: data.value
        };
        Node.log.info(this, `response ${data.res.req.url} < ${JSON.stringify(body)}`);
        data.res.json(body);
      }
    });

    app.get(this.route, (req, res) => {
      res.set('Connection', 'close');
      const output = this.output(req.params.plug);
      const value = Number(req.params.value || 1);
      if (Number.isNaN(value)) {
        Node.log.warn(this, 'bad request, value was ' + req.params.value)
        res.sendStatus(400);
      } else {
        Node.log.info(this, `request ${req.url}`);
        output.send({
          value,
          res: output.hasResponseInput ? res : null
        });

        if (!output.hasResponseInput) {
          res.sendStatus(200);
        }
      }
    });
  }
}

module.exports = HttpNode;
