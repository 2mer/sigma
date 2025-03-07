import { useEffect } from "react";
import useSignal from "./useSignal";
import useConst from "./useConst";
import { isSignal, type Signal, type ReadonlySignal } from "./signal";

export function useComputed<T extends () => unknown>(
	compute: T,
	deps: any[],
): ReadonlySignal<ReturnType<T>> {
	const initialCompute = useConst(() => compute());
	const $ = useSignal<ReturnType<T>>(initialCompute as ReturnType<T>);

	useEffect(() => {
		const signals: Signal<any>[] = deps.filter((d) => isSignal(d));

		function handleChange() {
			$.value = compute() as ReturnType<T>;
		}

		signals.forEach((s) => s.sub(handleChange));

		handleChange();

		return () => {
			signals.forEach((s) => s.unsub(handleChange));
		};
	}, deps);

	return $.readonly;
}
