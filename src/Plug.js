class Plug {
  constructor(config, index, node) {
    Object.assign(this, config);
    this.index = index;
    this.node = node;
  }
  
  // TODO plug labels (rename name to id)
  
  get desc() {
    return `${this.node.name}[${this.name || this.index}]`;
  }

  _checkValue(value) {
    if (typeof(value) !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Value must be a number or an object, was ' +
      Number.isNaN(value) ? 'NaN' : typeof(value));
    }    
  }
}

module.exports = Plug;
