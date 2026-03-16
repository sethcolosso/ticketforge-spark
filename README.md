# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## M-Pesa setup (STK Push)

The `mpesa-stk-push` edge function requires **all** of these secrets for a real payment request:

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_PASSKEY`
- `MPESA_SHORTCODE`
- Optional: `MPESA_ENV` (`sandbox` or `production`)

Set them with Supabase CLI:

```sh
supabase secrets set MPESA_CONSUMER_KEY="..."
supabase secrets set MPESA_CONSUMER_SECRET="..."
supabase secrets set MPESA_PASSKEY="..."
supabase secrets set MPESA_SHORTCODE="..."
supabase secrets set MPESA_ENV="sandbox"
```

### If you only have consumer key + secret

In `sandbox`, the function will auto-use Daraja test defaults (`174379` + sandbox passkey) if `MPESA_PASSKEY` / `MPESA_SHORTCODE` are missing. In `production`, you must set both values.

- **Shortcode**: your assigned PayBill/Till number from Safaricom Daraja.
- **Passkey**: generated for your Daraja app (Lipa Na M-Pesa Online).

If sandbox defaults are unavailable or you are on production without these values, the function falls back to simulation mode (so checkout can continue) and marks the response as `simulated: true`.


### Troubleshooting: "failed to send a request to Edge Function"

If checkout cannot reach `mpesa-stk-push`, deploy functions and verify env values:

```sh
supabase functions deploy mpesa-stk-push
supabase secrets list
```

For local dev, run:

```sh
supabase start
supabase functions serve mpesa-stk-push --no-verify-jwt
```

Then ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` point to the same Supabase project where the function is deployed.


## Paystack Lipa na M-Pesa setup

Checkout now supports a Paystack-first Lipa na M-Pesa flow via the `paystack-mpesa-charge` edge function.

Required secret:

```sh
supabase secrets set PAYSTACK_SECRET_KEY="<your_paystack_secret>"
supabase secrets set PAYSTACK_ENV="test"
```

Deploy function:

```sh
supabase functions deploy paystack-mpesa-charge
```

Notes:
- Amount is sent in KES and converted to minor units (x100) before charge initiation.
- If `PAYSTACK_SECRET_KEY` is not set, the function returns a simulated success so checkout demos can continue.
