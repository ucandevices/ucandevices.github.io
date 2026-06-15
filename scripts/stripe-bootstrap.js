#!/usr/bin/env node
/*
 * Bootstrap Stripe products + prices + Payment Links from products.json.
 *
 * Usage:
 *   export STRIPE_SECRET_KEY=sk_test_xxx
 *   node scripts/stripe-bootstrap.js
 *
 * Idempotent: skips any product that already has a non-empty stripeUrl.
 * Stores the shared shipping_rate ID in .stripe-config.json so re-runs reuse it.
 * Requires Node 18+ (uses global fetch).
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PRODUCTS_FILE = path.join(REPO_ROOT, 'products.json');
const CONFIG_FILE = path.join(REPO_ROOT, '.stripe-config.json');
const SITE_BASE = 'https://ucandevices.github.io/';

const SHIPPING = {
    display_name: 'Standard shipping',
    amount_cents: 2500,
    currency: 'usd',
    min_days: 5,
    max_days: 14,
};

const ALLOWED_COUNTRIES = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
    'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
    'GB','CH','NO','IS','LI',
    'US','CA','AU','NZ','JP','SG','HK','KR','TW','IL','AE','SA','ZA','MX','BR',
    'IN','TH','MY','ID','PH','TR','UA',
];

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
    console.error('Missing STRIPE_SECRET_KEY env var. Use a sk_test_... key for now.');
    process.exit(1);
}
const MODE = KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST';
console.log(`Running in ${MODE} mode.`);

function formEncode(obj, prefix) {
    const pairs = [];
    for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === undefined) continue;
        const key = prefix ? `${prefix}[${k}]` : k;
        if (Array.isArray(v)) {
            v.forEach((item, i) => {
                if (item !== null && typeof item === 'object') {
                    pairs.push(formEncode(item, `${key}[${i}]`));
                } else {
                    pairs.push(`${encodeURIComponent(key + '[]')}=${encodeURIComponent(item)}`);
                }
            });
        } else if (typeof v === 'object') {
            pairs.push(formEncode(v, key));
        } else {
            pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
    }
    return pairs.join('&');
}

async function stripe(method, endpoint, payload) {
    const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload ? formEncode(payload) : undefined,
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(`Stripe ${method} ${endpoint} failed: ${json.error ? json.error.message : JSON.stringify(json)}`);
    }
    return json;
}

function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n');
}

async function ensureShippingRate(cfg) {
    const cacheKey = MODE === 'LIVE' ? 'shipping_rate_live' : 'shipping_rate_test';
    if (cfg[cacheKey]) {
        console.log(`Reusing shipping rate ${cfg[cacheKey]} (${cacheKey}).`);
        return cfg[cacheKey];
    }
    console.log('Creating shipping rate...');
    const rate = await stripe('POST', '/shipping_rates', {
        display_name: SHIPPING.display_name,
        type: 'fixed_amount',
        fixed_amount: { amount: SHIPPING.amount_cents, currency: SHIPPING.currency },
        delivery_estimate: {
            minimum: { unit: 'business_day', value: SHIPPING.min_days },
            maximum: { unit: 'business_day', value: SHIPPING.max_days },
        },
    });
    cfg[cacheKey] = rate.id;
    saveConfig(cfg);
    console.log(`Created shipping rate ${rate.id}.`);
    return rate.id;
}

async function createForProduct(p, shippingRateId) {
    console.log(`\n[${p.title}] creating product...`);
    const product = await stripe('POST', '/products', {
        name: p.title,
        description: p.desc,
        images: [SITE_BASE + p.img],
        url: SITE_BASE + p.link,
    });
    console.log(`  product ${product.id}`);

    const price = await stripe('POST', '/prices', {
        product: product.id,
        unit_amount: Math.round(p.cost * 100),
        currency: 'usd',
    });
    console.log(`  price   ${price.id} (${p.cost} USD)`);

    const link = await stripe('POST', '/payment_links', {
        line_items: [{
            price: price.id,
            quantity: 1,
            adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
        }],
        shipping_address_collection: { allowed_countries: ALLOWED_COUNTRIES },
        shipping_options: [{ shipping_rate: shippingRateId }],
        phone_number_collection: { enabled: true },
        allow_promotion_codes: true,
    });
    console.log(`  link    ${link.url}`);
    return link.url;
}

async function main() {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    const cfg = loadConfig();
    const shippingRateId = await ensureShippingRate(cfg);

    let updated = 0;
    for (const p of products) {
        if (!p.canbuy) continue;
        if (p.stripeUrl && p.stripeUrl.startsWith('https://')) {
            console.log(`Skipping ${p.title} (already has stripeUrl).`);
            continue;
        }
        try {
            p.stripeUrl = await createForProduct(p, shippingRateId);
            updated++;
        } catch (err) {
            console.error(`  FAILED: ${err.message}`);
        }
    }

    if (updated > 0) {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 4) + '\n');
        console.log(`\nWrote ${updated} stripeUrl entries into products.json.`);
    } else {
        console.log('\nNothing to update.');
    }
    console.log(`Done. Mode: ${MODE}.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
