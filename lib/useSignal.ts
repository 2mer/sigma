import { type Signal, signal } from "./signal";
import useConst from "./useConst";

export default function useSignal<T>(defaultValue: T): Signal<T> {
	return useConst(() => signal(defaultValue));
}
