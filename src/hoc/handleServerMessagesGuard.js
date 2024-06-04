import React, { useEffect, useRef, useState } from "react";
import { SignatureAction } from "../types/shared.types";
import { useLocalStorageKeystore } from "../services/LocalStorageKeystore";
import Spinner from '../components/Spinner';
import { SigningRequestHandlerService } from '../services/SigningRequestHandlers';
import { useApi } from "../api";

const REACT_APP_WS_URL = process.env.REACT_APP_WS_URL;
const REACT_APP_WALLET_BACKEND_URL = process.env.REACT_APP_WALLET_BACKEND_URL;

export default function handleServerMessagesGuard(Component) {
	return (props) => {
		const api = useApi();
		const appToken = api.getAppToken();

		const [handshakeEstablished, setHandshakeEstablished] = useState(false);
		const [isOnline, setIsOnline] = useState(navigator.onLine);
		const socketRef = useRef(null);
		const keystore = useLocalStorageKeystore();
		const signingRequestHandlerService = SigningRequestHandlerService();

		const checkOnlineStatus = async () => {
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

		useEffect(() => {
			if (isOnline && appToken) {
				if (!socketRef.current) {
					console.log('Attempting to establish WebSocket connection...');
					const socket = new WebSocket(REACT_APP_WS_URL);
					socketRef.current = socket;

					const sendInit = () => {
						console.log('WebSocket connection opened');
						if (!appToken) {
							console.log('No appToken available, cannot send handshake');
							return;
						}
						console.log("Sending handshake request...");
						socket.send(JSON.stringify({ type: "INIT", appToken: appToken }));
						socket.removeEventListener('open', sendInit);
					};

					const awaitHandshake = (event) => {
						try {
							const message = JSON.parse(event.data.toString());
							if (message?.type === "FIN_INIT") {
								console.log("Handshake successful");
								setHandshakeEstablished(true);
								socket.removeEventListener('message', awaitHandshake);
								socket.addEventListener('message', handleMessage);
							}
						} catch (e) {
							console.error("Failed to handle message during WebSocket startup", e);
						}
					};

					const handleMessage = (event) => {
						try {
							const { message_id, request } = JSON.parse(event.data.toString());
							if (request.action == SignatureAction.createIdToken) {
								signingRequestHandlerService.handleCreateIdToken(socket, keystore, { message_id, ...request });
							} else if (request.action == SignatureAction.signJwtPresentation) {
								signingRequestHandlerService.handleSignJwtPresentation(socket, keystore, { message_id, ...request });
							} else if (request.action == SignatureAction.generateOpenid4vciProof) {
								signingRequestHandlerService.handleGenerateOpenid4vciProofSigningRequest(socket, keystore, { message_id, ...request });
							}
						} catch (e) {
							console.error("Failed to handle message", e);
						}
					};

					socket.addEventListener('open', sendInit);
					socket.addEventListener('message', awaitHandshake);
				}

			} else if (socketRef.current) {
				console.log('WebSocket closing due to offline or no appToken');
				socketRef.current.close();
				socketRef.current = null;
				setHandshakeEstablished(false);
			}
		}, [appToken, isOnline]);

		if (!isOnline || handshakeEstablished === true || !appToken) {
			console.log('Rendering component');
			return (<Component {...props} />);
		} else {
			console.log('Rendering spinner');
			return (<Spinner />); // loading component
		}
	};
}
