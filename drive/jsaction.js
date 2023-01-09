const ATT_jsaction = 'jsaction';
const PROP_jsaction = '__jsaction';

class EventContract {
  constructor(container) {
    this.container_ = container;
    this.actionMap_ = {};
  }

  enableEvent(eventName) {
    this.container_.addEventListener(eventName, this.makeHandler_(eventName));
  }

  registerAction(actioName, fn) {
    this.actionMap_[actionName] = fn;
  }

  makeHandler_(eventName) {
    const self = this;
    return function(event) {
      self.handleEvent_(eventName, event);
    };
  }

  handleEvent_(eventName, event) {
    const targetNode = event.target;
    for (let configNode = targetNode; configNode; configNode = configNode.parentNode) {
      const nodeActionMap = this.getNodeActionMap_(node);
      if (nodeActionMap && eventName in nodeActionMap) {
        const actionName = nodeActionMap[eventName];
        this.actionMap_[actionName](new ActionFlow(eventName, targetNode, event, configNode));
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }

  getNodeActionMap_(configNode) {
    if (PROP_jsaction in configNode) {
      return configNode[PROP_jsaction];
    }
    const jsaction = configNode.getAttribute(ATT_jsaction);
    if (!jsaction) {
      configNode[PROP_jsaction] = null;
      return null;
    }
    const ret = {};
    for (const entry of jsaction.split(/\s*,\s*/)) {
      const [key, value, ...extra] = entry.split(/\s*:\s*/);
      ret[key] = value;
    }
    configNode[PROP_jsaction] = ret;
    return ret;
  }
}

class ActionFlow {
  constructor(eventName, targetNode, event, configNode) {
    this.eventName_ = eventName;
    this.targetNode_ = targetNode;
    this.event_ = event;
    this.configNode_ = configNode;
  }
}
