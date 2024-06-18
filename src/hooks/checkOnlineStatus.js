import { useEffect, useState } from "react";

const REACT_APP_WALLET_BACKEND_URL = process.env.REACT_APP_WALLET_BACKEND_URL;

const checkOnlineStatus = async () => {
	const navigatorOnline = navigator.onLine;

	const checkApiStatus = async () => {
		try {
			await fetch(`${REACT_APP_WALLET_BACKEND_URL}/status`, {
				method: 'GET',
				cache: 'no-store'
			});
			return true;
		} catch (error) {
			return false;
		}
	};

	const apiOnline = await checkApiStatus();

	console.log(navigatorOnline, apiOnline);
	// If either navigator or API is offline, return false (offline)
	if (!navigatorOnline || !apiOnline) {
		return false;
	}
	// If both navigator and API are online, return true (online)
	return true;
};

export const useOnlineStatus = () => {
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		const handleOnlineStatus = async () => {
			const online = await checkOnlineStatus();
			setIsOnline(online);
			console.log(`User is ${online ? 'online' : 'offline'}`);
		};

		// Initial check
		handleOnlineStatus();

		const intervalId = setInterval(handleOnlineStatus, 5000); // check every 5 seconds

		window.addEventListener('online', handleOnlineStatus);
		window.addEventListener('offline', handleOnlineStatus);

		return () => {
			clearInterval(intervalId);
			window.removeEventListener('online', handleOnlineStatus);
			window.removeEventListener('offline', handleOnlineStatus);
		};
	}, []);

	return isOnline;
};

