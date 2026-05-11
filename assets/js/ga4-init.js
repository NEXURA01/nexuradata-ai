(() => {
	const GA_MEASUREMENT_ID = "G-TC31YSS01P";
	const CONSENT_STORAGE_KEY = "nexuradata_cookie_consent_v1";
	const CONSENT_VERSION = 1;
	let ga4Loaded = false;

	window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

	const readConsent = () => {
		try {
			const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
			if (!stored) return null;
			const parsed = JSON.parse(stored);
			if (parsed?.version !== CONSENT_VERSION) return null;
			return parsed;
		} catch {
			return null;
		}
	};

	const applyGaDisable = (consent) => {
		window[`ga-disable-${GA_MEASUREMENT_ID}`] = consent?.analytics !== true;
	};

	const loadGa4 = (consent = readConsent()) => {
		applyGaDisable(consent);

		if (ga4Loaded || consent?.analytics !== true) return;

		const script = document.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
		document.head.appendChild(script);

		window.gtag("js", new Date());
		window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
		ga4Loaded = true;
	};

	window.nexuraApplyTrackingConsent = loadGa4;
	loadGa4();
})();
