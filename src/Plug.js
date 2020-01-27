class Plug {
  constructor(config, index, node) {
    Object.assign(this, config);
    this.index = index;
    this.node = node;
  }
  
  get desc() {
    return `${this.node.name}[${this.name || this.index}]`;
  }
}

module.exports = Plug;
