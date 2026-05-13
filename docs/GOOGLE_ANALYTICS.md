# Google Analytics

Google Analytics is loaded by `components/GoogleAnalytics.tsx` and mounted in `app/layout.tsx`.

The integration is environment-gated. It stays disabled unless this public environment variable is configured:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Use the GA4 Measurement ID from Google Analytics Data Streams. Do not paste the full Google tag script into Vercel; only paste the `G-...` value.

Configure the variable in Vercel for Production and Preview, then redeploy the project.

The Content Security Policy in `next.config.ts` allows the Google Analytics and Google Tag Manager domains required by this integration.
