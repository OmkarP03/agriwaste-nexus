# Deploying AgriWaste Nexus

Backend on **Render**, frontend on **Vercel**, database on your existing **MongoDB Atlas** cluster.
Both hosts are free and sign in with GitHub. Allow about 30 minutes end to end.

Repo: `https://github.com/omkarpatange24-op007/agriwaste-nexus`

---

## Step 0 — Push your current code (do this first)

Render and Vercel build from GitHub, not from your laptop. Nothing you have changed
recently reaches them until you push.

```bash
cd agriwaste_nexus
git add -A
git commit -m "Deployment config; remove hackathon branding"
git push origin main
```

Then open the repo on GitHub and confirm `backend/routes/stats.js` and
`frontend/src/components/CreditPoolCard.jsx` are there. If they are missing, the push
did not include your latest work.

**Check that `backend/.env` is NOT on GitHub.** Your `.gitignore` excludes it, but open
the repo and look. If the file is visible, your database password is public — change the
Atlas password immediately before going further.

---

## Step 1 — Open MongoDB Atlas to the internet

Render's servers have changing IP addresses, so Atlas must accept connections from anywhere.

1. Sign in to MongoDB Atlas → your cluster → **Network Access**
2. **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm

Then get your connection string: **Database → Connect → Drivers**. Copy it and replace
`<password>` with your real database password. It looks like:

```
mongodb+srv://USER:PASSWORD@agriwaste-nexus.xxxxx.mongodb.net/agriwaste?retryWrites=true&w=majority
```

Add `/agriwaste` before the `?` if it is not already there — that names the database.

---

## Step 2 — Backend on Render

1. Go to <https://render.com> → **Get Started** → sign in with GitHub
2. **New +** → **Web Service** → connect the `agriwaste-nexus` repo
3. Fill in:

   | Field | Value |
   |---|---|
   | Name | `agriwaste-nexus-api` |
   | Region | Singapore |
   | Branch | `main` |
   | **Root Directory** | `backend` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |

   **Root Directory must be `backend`.** Leave it blank and the build fails, because
   `package.json` is not at the repo root.

4. **Environment Variables** → add these three:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string from Step 1 |
   | `JWT_SECRET` | a long random string — generate one, do not reuse your local value |
   | `NODE_VERSION` | `20` |

   For `JWT_SECRET`, run this and paste the output:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Create Web Service** and wait for the build (3–5 minutes).

**Verify before continuing.** Open `https://agriwaste-nexus-api.onrender.com/api/health`
in your browser. You should see:

```json
{"status":"ok","service":"AgriWaste Nexus API"}
```

If you do not, read the Render logs. `❌ MongoDB Error` means Step 1 or the connection
string is wrong. `JWT_SECRET is missing` means the variable did not save.

Copy your API URL — you need it in the next step.

---

## Step 3 — Frontend on Vercel

1. Go to <https://vercel.com> → sign in with GitHub
2. **Add New → Project** → import `agriwaste-nexus`
3. Fill in:

   | Field | Value |
   |---|---|
   | Framework Preset | Create React App |
   | **Root Directory** | `frontend` |
   | Build Command | leave default |
   | Output Directory | leave default |

4. **Environment Variables** → add **both**:

   | Key | Value |
   |---|---|
   | `REACT_APP_API_URL` | `https://agriwaste-nexus-api.onrender.com` (no trailing slash, no `/api`) |
   | `CI` | `false` |

   **`CI=false` is not optional.** Vercel sets `CI=true` by default, and with it
   `react-scripts build` treats every ESLint warning as a build failure. Without this
   variable your build will almost certainly fail on an unused-variable warning.

5. **Deploy**.

Your live link is the Vercel URL, something like
`https://agriwaste-nexus.vercel.app`. That is the link for the form.

---

## Step 4 — Load the demo data

A judge opening an empty app sees nothing. Seed the production database once, from your
own machine:

```bash
cd agriwaste_nexus/backend
MONGO_URI="<your Atlas connection string>" npm run seed
```

On Windows PowerShell:

```powershell
cd agriwaste_nexus\backend
$env:MONGO_URI="<your Atlas connection string>"
npm run seed
```

This creates `farmer@demo.com`, `buyer@demo.com` and `admin@demo.com` (password
`123456789`), four listings, calculation history and neighbouring farms so the district
benchmark and credit pool have something to show.

**If you get `querySrv ECONNREFUSED`**, that is the local DNS problem from before. In
Atlas use **Connect → Drivers → Node.js 2.2.12 or later**, which gives a non-SRV string
starting `mongodb://` with three hostnames. Use that one for the seed command. Render is
unaffected either way.

---

## Step 5 — Keep the backend awake

Render's free tier sleeps a service after 15 minutes idle. The next visitor waits about
50 seconds while it restarts — bad if that visitor is a judge.

Fix it in two minutes: go to <https://cron-job.org>, create a free account, and add a job
that requests `https://agriwaste-nexus-api.onrender.com/api/health` every 10 minutes.

---

## Step 6 — Test as a judge would

Open the Vercel link in a private browser window and check:

- [ ] The login page loads and the demo account buttons work
- [ ] Sign in as the farmer; the dashboard shows figures, not zeros
- [ ] The Waste Calculator returns results
- [ ] The Marketplace lists residue, and the Buyers tab shows a verified buyer
- [ ] The language toggle switches to Marathi
- [ ] It works on your phone over mobile data, not just wifi

If the pages load but every number is zero, Step 4 did not run against the database
Render is using.

---

## What to put on the form

| Field | Value |
|---|---|
| Prototype / demo link | your Vercel URL |
| Source code | `https://github.com/omkarpatange24-op007/agriwaste-nexus` |
| Demo credentials | `farmer@demo.com` / `123456789` |

Give the judges the demo login. An application they cannot get into scores as an
application that does not work.

---

## If something breaks

| Symptom | Cause |
|---|---|
| Vercel build fails on a warning | `CI=false` missing (Step 3) |
| Vercel build fails: no package.json | Root Directory not set to `frontend` |
| Render build fails: no package.json | Root Directory not set to `backend` |
| App loads, every request fails | `REACT_APP_API_URL` wrong, or has a trailing slash |
| Login says network error | Backend asleep — wait 50 seconds and retry |
| `❌ MongoDB Error` in Render logs | Atlas Network Access not open to `0.0.0.0/0` |
| Changing a Vercel env var does nothing | Env vars apply at build time — redeploy after changing one |
