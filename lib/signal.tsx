import React, { memo, type ComponentProps } from "react";
import EventEmitter from "eventemitter3";
import { useEffect, useState } from "react";
import SignalValue from "./SignalValue";

function identity<T>(v: T): T {
	return v;
}

export type Signal<T> = ReturnType<typeof signalImpl<T>>;
export type ReadonlySignal<T> = Omit<Signal<T>, "readonly" | 'set' | 'value'> & { readonly value: T };

export const SignalSymbol = Symbol("Signal");

function signalImpl<T>(value: T) {
	type Events = {
		changed: (value: T) => void;
	};

	const state = {
		value,
	};

	const events = new EventEmitter<Events>();

	type Handler = (v: T) => void;

	function use(): T;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	function use<R>(selector: (v: T) => R, deps?: any[]): R;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	function use(...args: any[]) {
		const [selector = identity<T>, deps = []] = args ?? [];

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const [state, setState] = useState<any>(selector($.value));

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			return $.sub((v) => {
				setState(selector(v));
			});
		}, deps);

		return state;
	}

	const readonly$ = {
		/**
		 * Subscribe to signal changes
		 * @returns a cleanup function to unsubscribe from the given handler
		 */
		sub(handler: Handler) {
			events.addListener("changed", handler);

			return () => {
				$.unsub(handler);
			};
		},

		/**
		 * Unsubscribe from the given handler
		 */
		unsub(handler: Handler) {
			events.removeListener("changed", handler);
		},

		/**
		 * A hook to use the signal's value in react component, this causes the component to subscribe to changes in the signal
		 * @param [selector] allows to select/transform the value before it is stored in the component state. can be used to rerender only when a part of the state changes
		 */
		use,

		/**
		 * A hook to cause an effect when the signal's value changes
		 */
		useEffect(handler: Handler, deps = []) {
			useEffect(() => {
				return $.sub(handler);
			}, deps);
		},

		/**
		 * **Get** a signal's value (without subscription).  
		 */
		get value() {
			return state.value;
		},

		/**
		 * a getter style function to get the signal's value
		 */
		get() {
			return state.value;
		},

		/**
		 * manually emit a change event with the current value of the signal
		 * useful to force render / recompute when using mutation
		 */
		bump() {
			events.emit("changed", state.value);
		},

		/**
		 * a component used to display a signal's value efficiently directly into the dom
		 */
		display: memo((props: ComponentProps<'span'> & { formatter?: (v: T) => unknown }) => {
			return <SignalValue signal$={readonly$} {...props} />;
		}),

		[SignalSymbol]: true,
	};

	const $ = {
		...readonly$,

		/**
		 * **Get** a signal's value (without subscription).  
		 * **Set** a signal's value, only if the value has changed (compared by reference) cause an event to be sent.  
		 */
		get value() {
			return state.value;
		},

		get() {
			return $.value;
		},

		/**
		 * **Set** a signal's value, only if the value has changed (compared by reference) cause an event to be sent.  
		 */
		set(v: T) {
			const changed = v !== state.value;
			if (changed) {
				state.value = v;
				$.bump()
			}
		},

		set value(v: T) {
			$.set(v);
		},

		/**
		 * a readonly view of this hook, the readonly view does not have access to the `set` methods
		 */
		get readonly() {
			return readonly$;
		},

		[SignalSymbol]: true,
	};

	return $;
}

export function signal<T>(v: T): Signal<T> {
	return signalImpl(v);
}

export function isSignal(o: any): o is Signal<any> {
	return SignalSymbol in o;
}