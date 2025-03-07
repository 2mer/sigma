import React from 'react';
import EventEmitter from "eventemitter3";
import { useEffect, useState } from "react";
import SignalValue from "./SignalValue";

function identity<T>(v: T): T { return v };

export type Signal<T> = ReturnType<typeof signalImpl<T>>
export type ReadonlySignal<T> = Omit<Signal<T>, 'readonly'>

export const SignalSymbol = Symbol('Signal');

function signalImpl<T>(value: T) {

	type Events = {
		changed: (value: T) => void;
	}

	const state = {
		value
	}

	const events = new EventEmitter<Events>();

	type Handler = (v: T) => void

	function use(): T
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	function use<R>(selector: (v: T) => R, deps?: any[]): R
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	function use(...args: any[]) {
		const [selector = identity<T>, deps = []] = args ?? [];

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const [state, setState] = useState<any>(selector($.value));

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			return $.sub((v) => {
				setState(selector(v))
			})
		}, deps)

		return state;
	}

	const readonly$ = {
		sub(handler: Handler) {
			events.addListener('changed', handler);

			return () => {
				$.unsub(handler);
			}
		},

		unsub(handler: Handler) {
			events.removeListener("changed", handler);
		},

		use,

		useEffect(handler: Handler, deps = []) {
			useEffect(() => {
				return $.sub(handler);
			}, deps)
		},

		get value() {
			return state.value
		},

		get() {
			return $.value;
		},

		display(formatter?: (v: T) => unknown) {
			return <SignalValue signal$={readonly$} formatter={formatter} />
		},

		[SignalSymbol]: true,

	}

	const $ = {
		...readonly$,

		get value() {
			return state.value
		},

		get() {
			return $.value;
		},

		set value(v: T) {
			const changed = v !== state.value;
			if (changed) {
				state.value = v;
				events.emit("changed", v);
			}
		},

		get readonly() {
			return readonly$
		},

		[SignalSymbol]: true
	}

	return $;

}

export function signal<T>(v: T): Signal<T> {
	return signalImpl(v)
}

export function isSignal(o: any): o is Signal<any> {
	return SignalSymbol in o;
}