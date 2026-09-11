# Boasted domain migration checklist (Squarespace Domains)

This checklist covers the permanent move of the legacy public frontend from `usebragstack.com` to `boasted.io`.

## Do not redirect the API hostname

Keep `api.usebragstack.com` in service while OAuth/provider callbacks and backend integrations still depend on it. This migration applies only to the public frontend domains:

- `usebragstack.com`
- `www.usebragstack.com`

## Squarespace Domains forwarding rule

In Squarespace Domains, open `usebragstack.com` → Website → Domain Forwarding Rules → Add rule.

Create a permanent forwarding rule with:

- Root subdomain: `@`
- Also add subdomain: `www`
- Destination: `boasted.io`
- Redirect type: `301 Permanent`
- Path forwarding: `Maintain paths`

This should produce mappings such as:

- `https://usebragstack.com/` → `https://boasted.io/`
- `https://usebragstack.com/guides/brag-document` → `https://boasted.io/guides/brag-document`
- `https://www.usebragstack.com/impact-receipts` → `https://boasted.io/impact-receipts`

Do not choose **Remove paths**, because old indexed URLs should land on their closest matching new URLs rather than all collapsing to the homepage.

## Search Console follow-up

After the 301 redirects are live and verified:

1. Keep the `boasted.io` sitemap submitted: `https://boasted.io/sitemap.xml`.
2. In the old `usebragstack.com` Search Console property, use **Settings → Change of Address** and select `boasted.io`.
3. Keep the redirects active for at least one year; keeping them indefinitely is preferable when feasible.
4. Monitor indexing, crawl errors, branded queries, and old-domain traffic until Google has consolidated the move.

## Verification

Verify both the root and deep-path behavior before declaring the migration complete:

```bash
curl -I https://usebragstack.com/
curl -I https://usebragstack.com/guides/brag-document
curl -I https://www.usebragstack.com/impact-receipts
```

Expected behavior is an HTTP `301` whose `Location` points to the equivalent `https://boasted.io/...` URL.
