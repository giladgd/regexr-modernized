/*
* EventDispatcher
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
* Modifications (C) 2026 Gilad S.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// constructor:
/**
 * EventDispatcher provides methods for managing queues of event listeners and dispatching events.
 *
 * You can either extend EventDispatcher or mix its methods into an existing prototype or instance by using the
 * EventDispatcher {{#crossLink "EventDispatcher/initialize"}}{{/crossLink}} method.
 *
 * Together with the CreateJS Event class, EventDispatcher provides an extended event model that is based on the
 * DOM Level 2 event model, including addEventListener, removeEventListener, and dispatchEvent. It supports
 * bubbling / capture, preventDefault, stopPropagation, stopImmediatePropagation, and handleEvent.
 *
 * EventDispatcher also exposes a {{#crossLink "EventDispatcher/on"}}{{/crossLink}} method, which makes it easier
 * to create scoped listeners, listeners that only run once, and listeners with associated arbitrary data. The
 * {{#crossLink "EventDispatcher/off"}}{{/crossLink}} method is merely an alias to
 * {{#crossLink "EventDispatcher/removeEventListener"}}{{/crossLink}}.
 *
 * Another addition to the DOM Level 2 model is the {{#crossLink "EventDispatcher/removeAllEventListeners"}}{{/crossLink}}
 * method, which can be used to listeners for all events, or listeners for a specific event. The Event object also
 * includes a {{#crossLink "Event/remove"}}{{/crossLink}} method which removes the active listener.
 *
 * <h4>Example</h4>
 * Add EventDispatcher capabilities to the "MyClass" class.
 *
 *      EventDispatcher.initialize(MyClass.prototype);
 *
 * Add an event (see {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}}).
 *
 *      instance.addEventListener("eventName", handlerMethod);
 *      function handlerMethod(event) {
 *          console.log(event.target + " Was Clicked");
 *      }
 *
 * <b>Maintaining proper scope</b><br />
 * Scope (ie. "this") can be be a challenge with events. Using the {{#crossLink "EventDispatcher/on"}}{{/crossLink}}
 * method to subscribe to events simplifies this.
 *
 *      instance.addEventListener("click", function(event) {
 *          console.log(instance == this); // false, scope is ambiguous.
 *      });
 *
 *      instance.on("click", function(event) {
 *          console.log(instance == this); // true, "on" uses dispatcher scope by default.
 *      });
 *
 * If you want to use addEventListener instead, you may want to use function.bind() or a similar proxy to manage
 * scope.
 *
 * <b>Browser support</b>
 * The event model in CreateJS can be used separately from the suite in any project, however the inheritance model
 * requires modern browsers (IE9+).
 */
import {Event} from "./Event";

type Listener = ((event: Event) => void) | {handleEvent: (event: Event) => void};
type Listeners = Record<string, Listener[]>;

export class EventDispatcher {
    public _listeners: Listeners | null;
    public _captureListeners: Listeners | null;
    public parent?: EventDispatcher;
    public off: EventDispatcher["removeEventListener"];

    public constructor() {
    // private properties:
        this._listeners = null;

        this._captureListeners = null;

        /**
         * A shortcut to the removeEventListener method, with the same parameters and return value. This is a companion to the
         * .on method.
         *
         * <b>IMPORTANT:</b> To remove a listener added with `on`, you must pass in the returned wrapper function as the listener. See
         * {{#crossLink "EventDispatcher/on"}}{{/crossLink}} for an example.
         * @param type The string type of the event.
         * @param listener The listener function or object.
         * @param [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
         */
        this.off = this.removeEventListener;
    }

    // public methods:
    /**
     * Adds the specified event listener. Note that adding multiple listeners to the same function will result in
     * multiple callbacks getting fired.
     *
     * <h4>Example</h4>
     *
     *      displayObject.addEventListener("click", handleClick);
     *      function handleClick(event) {
     *         // Click happened.
     *      }
     * @param type The string type of the event.
     * @param listener An object with a handleEvent method, or a function that will be called when
     * the event is dispatched.
     * @param [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     * @returns Returns the listener for chaining or assignment.
     */
    public addEventListener(type: string, listener: Listener, useCapture = false) {
        let listeners: Listeners;
        if (useCapture) {
            listeners = this._captureListeners = this._captureListeners || Object.create(null);
        } else {
            listeners = this._listeners = this._listeners || Object.create(null);
        }
        let arr = listeners[type];
        if (arr) {
            this.removeEventListener(type, listener, useCapture);
        }
        arr = listeners[type]; // remove may have deleted the array
        if (!arr) {
            listeners[type] = [listener];
        } else {
            arr.push(listener);
        }
        return listener;
    };

    /**
     * A shortcut method for using addEventListener that makes it easier to specify an execution scope, have a listener
     * only run once, associate arbitrary data with the listener, and remove the listener.
     *
     * This method works by creating an anonymous wrapper function and subscribing it with addEventListener.
     * The wrapper function is returned for use with `removeEventListener` (or `off`).
     *
     * <b>IMPORTANT:</b> To remove a listener added with `on`, you must pass in the returned wrapper function as the listener, or use
     * {{#crossLink "Event/remove"}}{{/crossLink}}. Likewise, each time you call `on` a NEW wrapper function is subscribed, so
     * multiple calls
     * to `on` with the same params will create multiple listeners.
     *
     * <h4>Example</h4>
     *
     *         var listener = myBtn.on("click", handleClick, null, false, {count:3});
     *         function handleClick(evt, data) {
     *             data.count -= 1;
     *             console.log(this == myBtn); // true - scope defaults to the dispatcher
     *             if (data.count == 0) {
     *                 alert("clicked 3 times!");
     *                 myBtn.off("click", listener);
     *                 // alternately: evt.remove();
     *             }
     *         }
     * @param type The string type of the event.
     * @param listener An object with a handleEvent method, or a function that will be called when
     * the event is dispatched.
     * @param [scope] The scope to execute the listener in. Defaults to the dispatcher/currentTarget for function listeners, and
     * to the listener itself for object listeners (ie. using handleEvent).
     * @param [once] If true, the listener will remove itself after the first time it is triggered.
     * @param [data] Arbitrary data that will be included as the second parameter when the listener is called.
     * @param [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     * @returns Returns the anonymous function that was created and assigned as the listener. This is needed to remove the
     * listener later using .removeEventListener.
     */
    public on<T>(type: string, listener: ((evt: Event, data?: T) => void) | {handleEvent: (evt: Event, data?: T) => void},
        scope?: object, once = false, data?: T, useCapture = false) {
        const handle = typeof listener === "function" ? listener : listener.handleEvent;
        return this.addEventListener(type, (evt) => {
            handle.call(scope || (typeof listener === "function" ? this : listener), evt, data);
            if (once) {
                evt.remove();
            }
        }, useCapture);
    }

    /**
     * Removes the specified event listener.
     *
     * <b>Important Note:</b> that you must pass the exact function reference used when the event was added. If a proxy
     * function, or function closure is used as the callback, the proxy/closure reference must be used - a new proxy or
     * closure will not work.
     *
     * <h4>Example</h4>
     *
     *      displayObject.removeEventListener("click", handleClick);
     * @param type The string type of the event.
     * @param listener The listener function or object.
     * @param [useCapture] For events that bubble, indicates whether to listen for the event in the capture or bubbling/target phase.
     */
    public removeEventListener(type: string, listener: Listener, useCapture = false) {
        const listeners = useCapture ? this._captureListeners : this._listeners;
        if (!listeners) {
            return;
        }
        const arr = listeners[type];
        if (!arr) {
            return;
        }
        for (let i = 0, l = arr.length; i < l; i++) {
            if (arr[i] === listener) {
                if (l == 1) {
                    delete (listeners[type]); // allows for faster checks.
                } else {
                    arr.splice(i, 1);
                }
                break;
            }
        }
    };

    /**
     * Removes all listeners for the specified type, or all listeners of all types.
     *
     * <h4>Example</h4>
     *
     *      // Remove all listeners
     *      displayObject.removeAllEventListeners();
     *
     *      // Remove all click listeners
     *      displayObject.removeAllEventListeners("click");
     * @param [type] The string type of the event. If omitted, all listeners for all types will be removed.
     */
    public removeAllEventListeners(type?: string) {
        if (!type) {
            this._listeners = this._captureListeners = null;
        } else {
            if (this._listeners) {
                delete (this._listeners[type]);
            }
            if (this._captureListeners) {
                delete (this._captureListeners[type]);
            }
        }
    };

    /**
     * Dispatches the specified event to all listeners.
     *
     * <h4>Example</h4>
     *
     *      // Use a string event
     *      this.dispatchEvent("complete");
     *
     *      // Use an Event instance
     *      var event = new Event("progress");
     *      this.dispatchEvent(event);
     * @param eventObj An object with a "type" property, or a string type.
     * While a generic object will work, it is recommended to use a CreateJS Event instance. If a string is used,
     * dispatchEvent will construct an Event instance if necessary with the specified type. This latter approach can
     * be used to avoid event object instantiation for non-bubbling events that may not have any listeners.
     * @param [bubbles] Specifies the `bubbles` value when a string was passed to eventObj.
     * @param [cancelable] Specifies the `cancelable` value when a string was passed to eventObj.
     * @returns Returns false if `preventDefault()` was called on a cancelable event, true otherwise.
     */
    public dispatchEvent(eventObj: Event | string, bubbles = false, cancelable = false) {
        if (typeof eventObj == "string") {
            // skip everything if there's no listeners and it doesn't bubble:
            const listeners = this._listeners;
            if (!bubbles && (!listeners || !listeners[eventObj])) {
                return true;
            }
            eventObj = new Event(eventObj, bubbles, cancelable);
        } else if (eventObj.target && eventObj.clone) {
            // redispatching an active event object, so clone it:
            eventObj = eventObj.clone();
        }

        // TODO: it would be nice to eliminate this. Maybe in favour of evtObj instanceof Event? Or !!evtObj.createEvent
        try {
            eventObj.target = this;
        } catch (e) {} // try/catch allows redispatching of native events

        if (!eventObj.bubbles || !this.parent) {
            this._dispatchEvent(eventObj, 2);
        } else {
            const list: EventDispatcher[] = [this];
            for (let parent: EventDispatcher | undefined = this.parent; parent; parent = parent.parent) {
                list.push(parent);
            }
            const l = list.length;

            // capture & atTarget
            for (let i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
                list[i]._dispatchEvent(eventObj, 1 + Number(i == 0));
            }
            // bubbling
            for (let i = 1; i < l && !eventObj.propagationStopped; i++) {
                list[i]._dispatchEvent(eventObj, 3);
            }
        }
        return !eventObj.defaultPrevented;
    };

    /**
     * Indicates whether there is at least one listener for the specified event type.
     * @param type The string type of the event.
     * @returns Returns true if there is at least one listener for the specified event.
     */
    public hasEventListener(type: string) {
        const listeners = this._listeners, captureListeners = this._captureListeners;
        return !!((listeners && listeners[type]) || (captureListeners && captureListeners[type]));
    };

    /**
     * Indicates whether there is at least one listener for the specified event type on this object or any of its
     * ancestors (parent, parent's parent, etc). A return value of true indicates that if a bubbling event of the
     * specified type is dispatched from this object, it will trigger at least one listener.
     *
     * This is similar to {{#crossLink "EventDispatcher/hasEventListener"}}{{/crossLink}}, but it searches the entire
     * event flow for a listener, not just this object.
     * @param type The string type of the event.
     * @returns Returns `true` if there is at least one listener for the specified event.
     */
    public willTrigger(type: string) {
        if (this.hasEventListener(type)) {
            return true;
        }
        for (let parent = this.parent; parent; parent = parent.parent) {
            if (parent.hasEventListener(type)) {
                return true;
            }
        }
        return false;
    };

    /**
     * @returns a string representation of the instance.
     */
    public toString() {
        return "[EventDispatcher]";
    };

    // private methods:
    /**
     * @param eventObj
     * @param eventPhase
     */
    public _dispatchEvent(eventObj: Event, eventPhase: number) {
        let l, arr;
        const listeners = (eventPhase <= 2) ? this._captureListeners : this._listeners;
        if (eventObj && listeners && (arr = listeners[eventObj.type]) && (l = arr.length)) {
            try {
                eventObj.currentTarget = this;
            } catch (e) {}
            try {
                eventObj.eventPhase = eventPhase | 0;
            } catch (e) {}
            eventObj.removed = false;

            arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
            for (let i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
                const o = arr[i];
                if (typeof o !== "function") {
                    o.handleEvent(eventObj);
                } else {
                    o(eventObj);
                }
                if (eventObj.removed) {
                    this.off(eventObj.type, o, eventPhase == 1);
                    eventObj.removed = false;
                }
            }
        }
        if (eventPhase === 2) {
            this._dispatchEvent(eventObj, 2.1);
        }
    };
}
