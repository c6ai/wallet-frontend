/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { openDB } from 'idb';

const DB_NAME = "wwwallet-db";
const DB_VERSION = 1;
const DB_STORAGE_VC_NAME = "storage";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
	upgrade(db) {
		db.createObjectStore(DB_STORAGE_VC_NAME);
	},
});

clientsClaim();

// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
precacheAndRoute([
	...self.__WB_MANIFEST,
	{ url: '/manifest.json', revision: '1' },
	{ url: '/favicon.ico', revision: '1' },
]);


// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(
	// Return false to exempt requests from being fulfilled by index.html.
	({ request, url }) => {
		// If this isn't a navigation, skip.
		if (request.mode !== "navigate") {
			return false;
		}
		// If this is a URL that starts with /_, skip.
		if (url.pathname.startsWith("/_")) {
			return false;
		}
		// If this looks like a URL for a resource, because it contains // a file extension, skip.
		if (url.pathname.match(fileExtensionRegexp)) {
			return false;
		}
		// Return true to signal that we want to use the handler.
		return true;
	},
	createHandlerBoundToURL(process.env.PUBLIC_URL + "/index.html")
);

// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
// and cross-origin .png requests for credential logo images
registerRoute(
	// Add in any other file extensions or routing criteria as needed.
	({ url }) =>
		url.pathname.endsWith(".png"), // Customize this strategy as needed, e.g., by changing to CacheFirst.
	new StaleWhileRevalidate({
		cacheName: "images",
		plugins: [
			// Ensure that once this runtime cache reaches a maximum size the
			// least-recently used images are removed.
			new ExpirationPlugin({ maxEntries: 50 }),
		],
	})
);

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

// In-memory store for sensitive data
const inMemoryStore = {};

async function fetchAndSaveResponse(request) {
	try {
		const response = await fetch(request);
		if (response.ok) {
			const url = request.url;
			if (isSensitiveResponse(url)) {
				inMemoryStore[url] = await response.clone().text();
			} else {
				saveResponseToIndexedDB(response.clone());
			}
			return response;
		}
	} catch (error) {
		const url = request.url;
		if (isSensitiveResponse(url)) {
			const storedResponse = inMemoryStore[url];
			if (storedResponse) {
				return new Response(storedResponse);
			}
		} else {
			const responseFromIndexedDB = await getResponseFromIndexedDB(url);
			if (responseFromIndexedDB) {
				return new Response(responseFromIndexedDB);
			}
		}
		throw error;
	}
}

async function saveResponseToIndexedDB(response) {
	return (await dbPromise).put(DB_STORAGE_VC_NAME, await response.text(), response.url);
}

async function getResponseFromIndexedDB(url) {
	return (await dbPromise).get(DB_STORAGE_VC_NAME, url);
}

function isSensitiveResponse(url) {
	const sensitiveEndpoints = [
		'/storage/vc',
		'/storage/vp',
		'/user/session/account-info',
	];
	return sensitiveEndpoints.some(endpoint => url.includes(endpoint));
}

const matchVCStorageCb = ({ url }) => url.pathname === "/storage/vc";
const handlerVCStorageCb = async ({ request }) => await fetchAndSaveResponse(request);

const matchVCStorageVp = ({ url }) => url.pathname === "/storage/vp";
const handlerVCStorageVp = async ({ request }) => await fetchAndSaveResponse(request);

const matchIssuersCb = ({ url }) => url.pathname === "/legal_person/issuers/all";
const handlerIssuersCb = async ({ request }) => await fetchAndSaveResponse(request);

const matchVerifiersCb = ({ url }) => url.pathname === "/verifiers/all";
const handlerVerifiersCb = async ({ request }) => await fetchAndSaveResponse(request);

const matchAccountInfoCb = ({ url }) => url.pathname === "/user/session/account-info";
const handlerAccountInfoCb = async ({ request }) => await fetchAndSaveResponse(request);

registerRoute(matchVCStorageCb, handlerVCStorageCb);
registerRoute(matchVCStorageVp, handlerVCStorageVp);
registerRoute(matchIssuersCb, handlerIssuersCb);
registerRoute(matchVerifiersCb, handlerVerifiersCb);
registerRoute(matchAccountInfoCb, handlerAccountInfoCb);
