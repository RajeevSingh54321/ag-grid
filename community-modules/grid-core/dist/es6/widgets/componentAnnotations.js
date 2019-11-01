/**
 * @ag-community/grid-core - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v22.0.0-beta.0
 * @link http://www.ag-grid.com/
 * @license MIT
 */
export function QuerySelector(selector) {
    return querySelectorFunc.bind(this, selector);
}
export function RefSelector(ref) {
    return querySelectorFunc.bind(this, "[ref=" + ref + "]");
}
function querySelectorFunc(selector, classPrototype, methodOrAttributeName, index) {
    if (selector === null) {
        console.error("ag-Grid: QuerySelector selector should not be null");
        return;
    }
    if (typeof index === "number") {
        console.error("ag-Grid: QuerySelector should be on an attribute");
        return;
    }
    addToObjectProps(classPrototype, 'querySelectors', {
        attributeName: methodOrAttributeName,
        querySelector: selector
    });
}
// think we should take this out, put property bindings on the
export function Listener(eventName) {
    return listenerFunc.bind(this, eventName);
}
function listenerFunc(eventName, target, methodName) {
    if (eventName === null) {
        console.error("ag-Grid: EventListener eventName should not be null");
        return;
    }
    addToObjectProps(target, 'listenerMethods', {
        methodName: methodName,
        eventName: eventName
    });
}
// think we should take this out, put property bindings on the
export function Method(eventName) {
    return methodFunc.bind(this, eventName);
}
function methodFunc(alias, target, methodName) {
    if (alias === null) {
        console.error("ag-Grid: EventListener eventName should not be null");
        return;
    }
    addToObjectProps(target, 'methods', {
        methodName: methodName,
        alias: alias
    });
}
function addToObjectProps(target, key, value) {
    // it's an attribute on the class
    var props = getOrCreateProps(target, target.constructor.name);
    if (!props[key]) {
        props[key] = [];
    }
    props[key].push(value);
}
function getOrCreateProps(target, instanceName) {
    if (!target.__agComponentMetaData) {
        target.__agComponentMetaData = {};
    }
    if (!target.__agComponentMetaData[instanceName]) {
        target.__agComponentMetaData[instanceName] = {};
    }
    return target.__agComponentMetaData[instanceName];
}