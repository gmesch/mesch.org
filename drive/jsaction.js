class EventContract {
  constructor(container) {
    this.container_ = container;
    this.actionMap_ = {};
  }

  enableEvent(name) {
    this.container_.addEventListener(name, this.makeHandler_(name));
  }

  makeHandler_(name) {
    const self = this;
    return function(event) {
      self.handleEvent_(name, event);
    };
  }

  handleEvent_(name, event) {
    const node = event.target;
    for (let n = node; n; n = n.parentNode) {
      const actionMap = this.getActionMap_(n);
      if (actionMap && name in actionMap) {
        const actionName = actionMap[name];
        this.actionMap_[name](name, node, event, n);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }

  registerAction(name, fn) {
    this.actionMap_[name] = fn;
  }
}
