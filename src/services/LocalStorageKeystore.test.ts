import { useLocalStorageKeystore } from "./LocalStorageKeystore";


it('runs the test', () => {
	const keystore = useLocalStorageKeystore();
	console.log(keystore);
	expect(false).toBe(true);
});
