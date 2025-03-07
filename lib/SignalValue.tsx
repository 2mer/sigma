import React, { type ComponentProps, useEffect, useRef } from "react";
import type { ReadonlySignal } from "./signal";

/**
 * A component used to display the contents of a signal into a span.
 * the content is directly applied to the dom and does not cause unecessary re-renders in react
 */
function SignalValue<T>({
	signal$,
	formatter = (v) => String(v),
	...rest
}: {
	signal$: ReadonlySignal<T>;
	formatter?: (v: T) => unknown;
} & ComponentProps<"span">) {
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

	return (
		<span ref={ref} {...rest}>
			{String(formatter(signal$.value))}
		</span>
	);
}

export default SignalValue;
