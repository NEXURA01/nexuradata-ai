# Supabase Edge Function: estimate

This function keeps `OPENAI_API_KEY` server-side in Supabase Edge Function secrets. It receives the assessment form payload, asks OpenAI for a cautious operational estimate, saves the lead and estimate to Supabase, then returns the estimate for display on the assessment page.

Required Supabase secret:

```bash
npm run supabase:secrets:set -- OPENAI_API_KEY=<your-openai-project-key>
```

Deploy:

```bash
npm run supabase:db:push
npm run supabase:functions:deploy:estimate
```

Current flow:

```txt
Assessment Form
-> Supabase Edge Function
-> OpenAI estimate
-> leads + ai_estimates rows
-> estimate display
```

Stripe checkout remains out of this milestone until the AI estimate and Supabase save are confirmed in production.

The function reads `OPENAI_API_KEY` with `Deno.env.get("OPENAI_API_KEY")`. Do not place this key in HTML, public JavaScript, public environment variables or database tables.
