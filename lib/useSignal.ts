import { type Signal, signal } from "./signal";
import useConst from "./useConst";

/**
 * A hook that creates a signal
 * the signal's reference is stable
 *
 * @param defaultValue
 * @returns signal
 */
export default function useSignal<T>(defaultValue: T): Signal<T> {
	return useConst(() => signal(defaultValue));
}
