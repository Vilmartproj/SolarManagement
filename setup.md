# Solar Management System - Server Setup Guide

Ye guide aapko help karegi is project ko kisi bhi naye server (production ya testing) par deploy karne mein.

## Prerequisites
Server par deploy karne se pehle, ensure karein ki server par niche di gayi cheezein installed hain:
1. **Node.js** (v18 ya latest)
2. **PostgreSQL** Database server (locally installed ya kisi cloud provider jaise AWS RDS, Supabase aadi par)

---

## Step-by-Step Setup Process

### Step 1: Code Clone & Dependencies Install Karna
Sabse pehle project folder (`server`) mein jayein aur dependencies install karein.

```bash
cd server
npm install
```

### Step 2: Environment Variables Setup Karna
Server environment ke hisaab se credentials set karein. Ek naya `.env` file banayein:

```bash
# Agar Linux/Mac par hain:
cp .env.example .env

# Agar Windows server par hain:
copy .env.example .env
```

Ab `.env` file ko open karke apna NAYA `DATABASE_URL` set karein. Example:
```env
# Change username, password, host, port, and database name
DATABASE_URL="postgresql://username:password@localhost:5432/solar_management?schema=public"

PORT=5001
JWT_SECRET=your_super_secret_jwt_key
```

### Step 3: Database Schema Create Karna (Prisma Migrations)
Kyunki hamare paas migrations already hain, hume bas Prisma ko naye database mein wo apply karne ko bolna hai. Isse aapki saari tables aur enums automatically ban jayengi.

```bash
npx prisma migrate deploy
```
> **Note:** `migrate deploy` purane migration script (`0_init`) ko chalayega aur database ko fresh create kar dega. Ye naye server par schema setup karne ka sabse safe tareeka hai.

### Step 4: Prisma Client Generate Karna
Naye system/OS architecture ke hisaab se Prisma Client banayein, taaki database queries run ho sakein:

```bash
npx prisma generate
```

### Step 5: Backend Server Start Karna
Ab aapka setup complete ho gaya hai! Server ko start karein:

```bash
# Development ke liye:
npm run dev

# Production ke liye:
npm start
```

> **Production Tip:** Production server par application ko background mein chalane aur crash hone par auto-restart karne ke liye aap **PM2** ka use kar sakte hain:
> ```bash
> npm install -g pm2
> pm2 start src/index.js --name "solar-backend"
> pm2 save
> ```

> ```

---

## Future Updates (Nayi Migrations Deploy Karna)
Jab bhi aap development ke dauran database schema change karte hain (jaise koi naya table ya column add karna) aur wo changes branch ke through server par push karte hain, toh un naye changes ko server par apply karne ka process ye hoga:

1. **Latest Code Pull Karein:**
   ```bash
   git pull origin main  # Ya jo bhi aapki branch ho
   ```

2. **Dependencies Update Karein (Agar jarurat ho):**
   ```bash
   npm install
   ```

3. **Nayi Migrations Apply Karein:**
   Database schema ko naye code ke hisaab se update karne ke liye ye chalayein:
   ```bash
   npx prisma migrate deploy
   ```
   *(Ye command sirf unn migrations ko run karegi jo abhi tak server par apply nahi hui hain. Purani tables ya data ko koi nuksan nahi hoga.)*

4. **Prisma Client Regenerate Karein:**
   Naye columns ya tables ko aapke code mein access karne ke liye Prisma Client ko update karna zaruri hai:
   ```bash
   npx prisma generate
   ```

5. **Server Restart Karein:**
   Agar aap PM2 use kar rahe hain:
   ```bash
   pm2 restart solar-backend
   ```
   Ya agar normal chala rahe hain toh stop karke dobara `npm start` karein.

---

## Troubleshooting Tips
- Agar `prisma migrate deploy` error deta hai ki database exist nahi karta, toh make sure PostgreSQL mein `solar_management` naam ka database (ya jo aapne URL mein diya hai) pehle se bana hua ho. (e.g. DBeaver ya psql CLI se `CREATE DATABASE solar_management;` run kar lein).
- Hamesha ensure karein ki `npx prisma generate` zarur run ho, especially agar aap OS change kar rahe hain (jaise Windows se Linux).
