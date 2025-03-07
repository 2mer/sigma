import React, { useEffect, useRef } from "react";
import type { ReadonlySignal } from "./signal";

function SignalValue<T>({
	signal$,
	formatter = (v) => String(v),
}: { signal$: ReadonlySignal<T>; formatter?: (v: T) => unknown }) {
	const ref = useRef<HTMLSpanElement>(null);
	const formatterRef = React.useRef(formatter);

	useEffect(() => {
		return signal$.sub((v) => {
			if (ref.current) {
				const formatted = String(formatterRef.current(v));
				if (formatted !== ref.current.innerText) {
					ref.current.innerText = formatted;
				}
			}
		});
	}, [signal$]);

	return <span ref={ref}>{String(formatter(signal$.value))}</span>;
}

export default SignalValue;
