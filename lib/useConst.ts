import { useRef } from "react";

const unset = Symbol('unset');

export default function useConst<T>(compute: () => T) {
	const ref = useRef<T | typeof unset>(unset);

	if (ref.current === unset) {
		ref.current = compute();
	}

	return ref.current as T;
}