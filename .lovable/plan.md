

# Fix Pricing Model: Remove Subscription Checkout

## Problem Identified
The landing page correctly displays "20% of saved revenue" pricing, but clicking "Start Free Trial" opens a Stripe checkout that charges **£49.00/month** — completely contradicting the advertised model.

## What Needs to Change

### Current State
| Element | Current | Problem |
|---------|---------|---------|
| CTA buttons | Opens Stripe checkout (£49/month) | Contradicts "free" messaging |
| Button text | "Start Free Trial" | Implies trial, not free forever |
| Footer note | "7-day free trial" | Wrong — it's free forever |

### Desired State  
| Element | New | Rationale |
|---------|-----|-----------|
| CTA buttons | Navigate to `/auth` (signup) | No payment needed to start |
| Button text | "Get Started Free" | Clear and accurate |
| Footer note | "Free forever • Pay only for results" | Matches performance model |

---

## Implementation Steps

### Step 1: Update Hero.tsx
- Remove `useStripeCheckout` hook import
- Remove `CheckoutFallbackDialog` component
- Change button click handler from `handleStartTrial` → `navigate('/auth')`
- Change button text: "Start Free Trial" → "Get Started Free"

### Step 2: Update Pricing.tsx  
- Remove `useStripeCheckout` hook import
- Remove `CheckoutFallbackDialog` component
- Change button click handler to navigate to `/auth`
- Change button text: "Start Free Trial" → "Get Started Free"
- Update footer: "No credit card required • 7-day free trial • Cancel anytime" → "No credit card required • Free forever • Pay only for results"

### Step 3: Update CTA.tsx
- Remove `useStripeCheckout` hook import
- Remove `CheckoutFallbackDialog` component  
- Change button click handler to navigate to `/auth`
- Change button text: "Start Free Trial" → "Get Started Free"
- Update trust point: "7-day free trial" → "Free forever"

### Step 4: Update Testimonials.tsx
- Remove `useStripeCheckout` hook import
- Remove `CheckoutFallbackDialog` component
- Change button click handler to navigate to `/auth`
- Change button text: "Start Free Trial" → "Get Started Free"
- Update subtext: "See if it works for you — pay nothing until it does" → "Start saving customers today"

### Step 5: Update SubscriptionGate.tsx
- Remove subscription check logic
- Allow all authenticated users through
- Keep component wrapper for future use if premium tiers are added

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/landing/Hero.tsx` | Remove checkout, change CTA |
| `src/components/landing/Pricing.tsx` | Remove checkout, update messaging |
| `src/components/landing/CTA.tsx` | Remove checkout, update messaging |
| `src/components/landing/Testimonials.tsx` | Remove checkout, update CTA |
| `src/components/SubscriptionGate.tsx` | Allow all authenticated users |

---

## User Flow After Changes

```text
Landing Page → "Get Started Free" → /auth (signup)
                                        ↓
                                   Dashboard (full access)
                                        ↓
                              Connect Stripe, build cancel flow
                                        ↓
                              Customer saved via widget
                                        ↓
                              20% fee tracked in saved_customers table
```

---

## Technical Notes

- The `create-checkout-session` edge function will be kept for potential future use (upgrades, premium tiers)
- The `useStripeCheckout` hook will remain in codebase but won't be used on landing page
- Fee tracking is already implemented via `saved_customers.churnshield_fee_per_month` generated column

