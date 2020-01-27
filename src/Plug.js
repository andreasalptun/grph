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
}

module.exports = Plug;
