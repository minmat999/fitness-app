# Fitness Tracker – publikavimas Azure (žingsnis po žingsnio)

Projekto aplankas šiame vadove: `C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas`

**Kaip bus sudėliota:** vienas Azure **App Service** atiduos ir React puslapį, ir API (`/api/...`), o duomenys bus **Azure Database for MySQL**. Tai atitinka L0 diegimo diagramą.

**Laiko reikės:** apie 1–1,5 val. pirmą kartą. Perpublikavimas po to trunka ~3 min.

> 📝 Pasiruošk užrašinę. Per vadovą užsirašysi 4 dalykus: **MySQL serverio adresą**, **MySQL admin vardą**, **MySQL slaptažodį** ir **Web App pavadinimą**.

---

## 0 ETAPAS. Sutvarkyk ir patikrink projektą savo kompiuteryje

Į Azure keliausi tai, kas veikia lokaliai, todėl pirma įsitikink, kad lokaliai viskas gerai.

### 0.1 Sutvarkyk sugadintas `users` ir `refreshtokens` lenteles

1. Atsidaryk **XAMPP Control Panel** → prie **MySQL** spausk **Stop**.
2. XAMPP skydelyje spausk **Explorer** → atsidarys XAMPP aplankas → eik į `mysql\data\fitness_tracker_l1\`.
3. Ištrink šiuos failus (jei kurio nors nėra, nieko tokio):
   `users.frm`, `users.ibd`, `refreshtokens.frm`, `refreshtokens.ibd`.
   ⚠️ **Kitų failų neliesk.**
4. XAMPP skydelyje prie **MySQL** spausk **Start**.
5. Atsidaryk **PowerShell** (Start → įrašyk „PowerShell“ → Enter) ir eik į backend aplanką:
   ```powershell
   cd "C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas\backend"
   ```
6. Sukurk lenteles iš naujo:
   ```powershell
   node -e "require('dotenv').config(); const { User, RefreshToken } = require('./src/models'); (async () => { await User.sync(); await RefreshToken.sync(); console.log('Lenteles sukurtos'); process.exit(0); })()"
   ```
   ✅ Turi parašyti `Lenteles sukurtos`.
7. Sukurk testinius naudotojus:
   ```powershell
   node scripts/seedUsers.js
   ```
   ✅ Turi išvardyti `admin@example.com`, `vartotojas1@example.com` ir t. t.

### 0.2 Įdiek naujus frontend paketus

```powershell
cd "C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas\frontend"
npm install
```

### 0.3 Patikrink, ar viskas veikia lokaliai

1. **Pirmas** PowerShell langas:
   ```powershell
   cd "C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas\backend"
   npm run dev
   ```
   ✅ `Prisijungta prie MySQL`, `Backend veikia: http://localhost:3000`
2. **Antras** PowerShell langas:
   ```powershell
   cd "C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas\frontend"
   npm run dev
   ```
3. Naršyklėje atsidaryk `http://localhost:5173` → prisijunk `admin@example.com` / `Admin123!` → paspaudyk meniu punktus.
4. Jei viskas veikia, abu langus sustabdyk (**Ctrl + C**).

---

## 1 ETAPAS. Aktyvuok Azure for Students

1. Atsidaryk <https://azure.microsoft.com/free/students>.
2. Spausk **Start free** (arba **Activate now**).
3. Prisijunk **KTU Microsoft paskyra**: tuo pačiu el. paštu ir slaptažodžiu, kuriuo jungiesi prie KTU OneDrive / Outlook.
4. Užpildyk formą: šalis **Lithuania**, vardas, telefono numeris (gali prašyti patvirtinti SMS kodu) → sutik su sąlygomis → **Sign up**.
5. Kai baigsi, atsidarys **Azure portalas** (<https://portal.azure.com>).
6. ✅ Patikrink: viršuje paieškoje įrašyk **Subscriptions** → turi matyti **Azure for Students** su būsena *Active*.

---

## 2 ETAPAS. Įdiek Azure CLI (komandų įrankį publikavimui)

1. PowerShell'e:
   ```powershell
   winget install -e --id Microsoft.AzureCLI
   ```
   Jei `winget` neatpažįstamas: atsisiųsk diegimo failą iš <https://aka.ms/installazurecliwindows> ir įdiek kaip įprastą programą.
2. **Uždaryk PowerShell langą ir atidaryk naują** (kitaip `az` komandos nebus).
3. Patikrink:
   ```powershell
   az --version
   ```
   ✅ Turi parodyti versiją, pvz. `azure-cli 2.xx.x`.
4. Prisijunk:
   ```powershell
   az login
   ```
   Atsidarys naršyklė → pasirink savo KTU paskyrą. Jei terminale paprašys pasirinkti prenumeratą, įrašyk numerį prie **Azure for Students** ir Enter.
5. ✅ Patikrink:
   ```powershell
   az account show --query name -o tsv
   ```
   Turi parašyti `Azure for Students`.

---

## 3 ETAPAS. Eksportuok lokalią duomenų bazę

1. XAMPP turi veikti **Apache** ir **MySQL** (žali).
2. Naršyklėje atsidaryk <http://localhost/phpmyadmin>.
3. Kairėje spausk **fitness_tracker_l1**.
4. Viršuje spausk skirtuką **Export**.
5. *Export method*: **Quick**, *Format*: **SQL** → spausk **Export**.
6. ✅ Į **Downloads** atsisiųs failas `fitness_tracker_l1.sql`.

---

## 4 ETAPAS. Sukurk Resource group (projekto „aplanką“ Azure'e)

1. <https://portal.azure.com> → viršuje paieškoje įrašyk **Resource groups** → atsidaryk.
2. Spausk **+ Create**.
3. Užpildyk:
   - *Subscription*: **Azure for Students**
   - *Resource group*: `fitness-tracker-rg`
   - *Region*: **(Europe) Sweden Central**
4. Spausk **Review + create** → **Create**.
5. ✅ Viršuje dešinėje pasirodys pranešimas „Resource group created“.

> Jei vėlesniuose žingsniuose Azure parašys, kad regionas neleidžiamas (*„not allowed / restricted“*), rinkis kitą Europos regioną (pvz. **Poland Central**, **Germany West Central**, **North Europe**). Svarbu, kad **MySQL ir Web App būtų tame pačiame regione**.

---

## 5 ETAPAS. Sukurk MySQL serverį

1. Paieškoje įrašyk **Azure Database for MySQL flexible servers** → atsidaryk → **+ Create**. Jei paklaus tipo, rinkis **Flexible server** → **Create**.
2. **Basics** skirtukas:
   | Laukas | Ką pasirinkti |
   |---|---|
   | Subscription | Azure for Students |
   | Resource group | `fitness-tracker-rg` |
   | Server name | `fitness-tracker-db-mm` (turi būti unikalus; jei užimtas, pridėk skaičių) |
   | Region | tas pats kaip 4 etape |
   | MySQL version | **8.0** |
   | Workload type | **For development or hobby projects** |
   | Compute + storage | spausk **Configure server** → *Compute tier*: **Burstable**, *Compute size*: **Standard_B1ms**, *Storage*: **20 GiB**, *Storage autogrowth*: nuimk varnelę → **Save** |
   | Availability zone | No preference |
   | High availability | **nepažymėta** |
   | Authentication method | **MySQL authentication only** |
   | Admin username | `ftadmin` |
   | Password / Confirm password | sugalvok stiprų (min. 8 simboliai, didžioji raidė, skaičius) |

   📝 **Užsirašyk:** admin vardą `ftadmin` ir slaptažodį.
3. Spausk **Next: Networking** (arba skirtuką **Networking**):
   - *Connectivity method*: **Public access (allowed IP addresses)**
   - ✅ pažymėk **Allow public access to this resource through the internet using a public IP address** (jei toks laukas yra)
   - ✅ pažymėk **Allow public access from any Azure service within Azure to this server**
   - spausk **+ Add current client IP address** (atsiras eilutė su tavo IP)
4. Kitus skirtukus palik kaip yra → **Review + create** → patikrink, ar kaina rodoma minimali / nemokama → **Create**.
5. Palauk **5–15 min.**, kol bus parašyta *„Your deployment is complete“* → **Go to resource**.
6. **Sukurk duomenų bazę:** kairiajame meniu **Settings → Databases** → **+ Add** → *Name*: `fitness_tracker_l1` → **Save**.
7. **Nusikopijuok serverio adresą:** kairėje **Overview** → laukas **Server name**, pvz. `fitness-tracker-db-mm.mysql.database.azure.com`.
   📝 **Užsirašyk** šį adresą.

---

## 6 ETAPAS. Perkelk duomenis į Azure MySQL

1. **Naujame** PowerShell lange eik į backend aplanką:
   ```powershell
   cd "C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas\backend"
   ```
2. Laikinai nurodyk Azure DB duomenis (pakeisk į **savo** adresą ir slaptažodį):
   ```powershell
   $env:DB_HOST = "fitness-tracker-db-mm.mysql.database.azure.com"
   $env:DB_USER = "ftadmin"
   $env:DB_PASSWORD = "TAVO_SLAPTAZODIS"
   $env:DB_NAME = "fitness_tracker_l1"
   $env:DB_SSL = "true"
   ```
3. Paleisk importą:
   ```powershell
   node scripts/importSql.js "$HOME\Downloads\fitness_tracker_l1.sql"
   ```
4. ✅ Turi matyti lenteles ir įrašų skaičius, pvz.:
   ```
   Vykdomas importas...
     dailylogs: 5 irasu
     foodentries: 15 irasu
     ...
     users: 6 irasu
   Importas baigtas.
   ```
5. **Uždaryk šį PowerShell langą.** Kitaip `$env:` kintamieji liktų galioti, ir lokalus backend tame lange jungtųsi prie Azure DB.

| Jei matai klaidą | Ką daryti |
|---|---|
| `ETIMEDOUT` / `connect ECONNREFUSED` | MySQL → **Settings → Networking** → **+ Add current client IP address** → **Save**, palauk 1 min. ir kartok |
| `Access denied for user` | Blogas `DB_USER` arba `DB_PASSWORD` |
| `Unknown database` | Nesukūrei DB (5 etapo 6 žingsnis) |
| `Unknown collation 'utf8mb4_uca1400_ai_ci'` | Atsidaryk `.sql` failą Notepad'e → *Ctrl+H* → pakeisk į `utf8mb4_general_ci` → išsaugok ir kartok |
| `Multiple primary key defined` | MySQL serveris → **Settings → Server parameters** → paieškoje `sql_generate_invisible_primary_key` → **OFF** → **Save**. Tada **Databases** → ištrink `fitness_tracker_l1`, sukurk iš naujo ir kartok importą |
| `Table '...' already exists` | Importą jau paleidai. Jei nori kartoti iš naujo: MySQL → *Databases* → ištrink ir vėl sukurk `fitness_tracker_l1` |

---

## 7 ETAPAS. Sukurk Web App (čia veiks tavo programa)

1. Paieškoje įrašyk **App Services** → **+ Create** → **Web App**.
2. **Basics** skirtukas:
   | Laukas | Ką pasirinkti |
   |---|---|
   | Subscription | Azure for Students |
   | Resource group | `fitness-tracker-rg` |
   | Name | `fitness-tracker-mm` (turi būti unikalus) |
   | Secure unique default hostname | **Off** (jei toks jungiklis yra; tada adresas bus paprastas `https://fitness-tracker-mm.azurewebsites.net`) |
   | Publish | **Code** |
   | Runtime stack | **Node 20 LTS** (arba Node 22 LTS) |
   | Operating System | **Linux** |
   | Region | tas pats kaip MySQL |
   | Linux Plan | **Create new** → pavadinimas `fitness-tracker-plan` → OK |
   | Pricing plan | spausk **Explore pricing plans** (arba *Change size*) → **Free F1** → **Select** |
   | Zone redundancy | Disabled |

   📝 **Užsirašyk** Web App pavadinimą.
3. Skirtuke **Database**: nieko nekurk (DB jau turi).
4. Skirtuke **Deployment**: *Continuous deployment*: **Disable**.
5. Skirtuke **Monitoring**: *Enable Application Insights*: **No**.
6. **Review + create** → **Create** → palauk ~1–2 min. → **Go to resource**.
7. ✅ **Overview** puslapyje matysi **Default domain**, pvz. `fitness-tracker-mm.azurewebsites.net`.

---

## 8 ETAPAS. Suvesk aplinkos kintamuosius (tai yra `.env` Azure'e)

1. Web App kairiajame meniu **Settings → Environment variables**.
2. Skirtukas **App settings** → kiekvienam kintamajam spausk **+ Add**, įvesk *Name* ir *Value* → **Apply** (lango apačioje):

| Name | Value | Iš kur paimti |
|---|---|---|
| `NODE_ENV` | `production` | įrašyk taip |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | įrašyk taip |
| `DB_HOST` | `fitness-tracker-db-mm.mysql.database.azure.com` | 📝 5 etapas |
| `DB_PORT` | `3306` | įrašyk taip |
| `DB_NAME` | `fitness_tracker_l1` | įrašyk taip |
| `DB_USER` | `ftadmin` | 📝 5 etapas |
| `DB_PASSWORD` | tavo slaptažodis | 📝 5 etapas |
| `DB_SSL` | `true` | įrašyk taip |
| `JWT_ACCESS_SECRET` | ilga eilutė | nukopijuok iš `backend\.env` |
| `JWT_REFRESH_SECRET` | ilga eilutė | nukopijuok iš `backend\.env` |
| `JWT_ACCESS_EXPIRES` | `15m` | įrašyk taip |
| `JWT_REFRESH_EXPIRES` | `7d` | įrašyk taip |
| `GEMINI_API_KEY` | raktas | nukopijuok iš `backend\.env` (jei naudoji DI įžvalgas) |

3. Kai visi įvesti, apačioje spausk **Apply** → **Confirm**.
4. ✅ Sąraše turi matyti visus 13 kintamųjų.

---

## 9 ETAPAS. Pirmas publikavimas

1. VS Code'e atsidaryk failą `deploy.ps1` (projekto šaknyje).
2. Viršuje pakeisk į **savo** pavadinimus ir išsaugok (**Ctrl + S**):
   ```powershell
   $ResourceGroup = "fitness-tracker-rg"
   $AppName       = "fitness-tracker-mm"
   ```
3. PowerShell'e eik į projekto šaknį:
   ```powershell
   cd "C:\Users\minde\OneDrive - Kaunas University of Technology\2026-2027\Saitynai\Projektas"
   ```
4. Paleisk:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
   ```
5. ✅ Turi matyti tris etapus ir pabaigą:
   ```
   1/3 Kompiliuojamas frontend...
   2/3 Pakuojamas backend i deploy.zip...
   3/3 Keliama i Azure (fitness-tracker-mm)... (gali uztrukti 2-5 min.)
   ...
   Baigta! Programa: https://fitness-tracker-mm.azurewebsites.net
   ```

---

## 10 ETAPAS. Patikrink, ar viskas veikia

1. Naršyklėje atsidaryk `https://<tavo-adresas>/api/health`.
   ✅ `{"status":"OK","service":"fitness-tracker-backend"}`. Pirmas atsidarymas gali trukti iki 1 min.
2. Atsidaryk `https://<tavo-adresas>`.
   ✅ Prisijungimo puslapis su paveiksliuku.
3. Prisijunk `admin@example.com` / `Admin123!` ir pereik per visus meniu punktus. Sukurk ir ištrink kokį nors valgymą.
4. Paspausk **F5**. ✅ Turi likti prisijungęs (veikia refresh tokenas).
5. **F12** → **Application** → **Cookies** → tavo adresas → `refreshToken`.
   ✅ Pažymėta **HttpOnly**, **Secure**, *SameSite*: **Strict**.
6. Telefone atsidaryk tą patį adresą. ✅ Hamburger meniu veikia.
7. *(Neprivaloma)* Postman: kolekcijos kintamąjį `baseUrl` pakeisk į `https://<tavo-adresas>/api` → **Run collection**.

🎉 Projektas patalpintas.

---

## 🔁 Kaip atnaujinti projektą po pakeitimų

Kai pakeiti kodą (frontend arba backend):

1. Lokaliai patikrink, kad veikia (`npm run dev`).
2. PowerShell'e projekto šaknyje:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
   ```
3. Po ~3 min. atnaujink puslapį naršyklėje.

Skriptas pats sukompiliuoja frontend ir įkelia naują versiją. **Duomenų bazė ir Azure nustatymai lieka nepakeisti.**

**Jei pakeitei duomenų bazės struktūrą** (pvz. pridėjai stulpelį), tą patį pakeitimą reikia padaryti ir Azure DB:
- arba per **MySQL Workbench** prisijungus prie Azure serverio;
- arba iš naujo eksportuoti lokalią DB ir importuoti kaip 6 etape (prieš tai ištrynus ir vėl sukūrus Azure DB).

**Jei pakeitei aplinkos kintamąjį** (pvz. naują Gemini raktą): Web App → **Environment variables** → pakeisk → **Apply**. Perpublikuoti nereikia.

---

## Jei kas nors neveikia

**Pirmiausia pažiūrėk klaidas:** Web App → kairėje **Monitoring → Log stream**. Ten matysi tą patį, ką lokaliai rodo backend terminalas.

| Ką matai | Priežastis ir sprendimas |
|---|---|
| `running scripts is disabled on this system` | Paleisk tiksliai taip: `powershell -ExecutionPolicy Bypass -File .\deploy.ps1` |
| `az : The term 'az' is not recognized` | Po Azure CLI įdiegimo neatidarei naujo PowerShell lango |
| Puslapyje **Application Error** arba **503** | Log stream. Dažniausiai trūksta kintamojo (8 etapas) arba backend neprisijungia prie DB |
| Log'e `ETIMEDOUT` / `ECONNREFUSED` prie MySQL | MySQL → **Networking** → ar pažymėta *Allow public access from any Azure service*. Patikrink `DB_HOST` |
| Log'e `Access denied for user` | Blogi `DB_USER` / `DB_PASSWORD` kintamieji |
| Log'e `insecure transport are prohibited` | Nenustatytas `DB_SSL` = `true` |
| Log'e `Table 'fitness_tracker_l1.Goals' doesn't exist` | MySQL → **Server parameters** → paieškoje `lower_case_table_names` → turi būti **1**. Jei ne, parašyk man |
| Prisijungus po F5 vėl išmeta | Nenustatytas `NODE_ENV` = `production` arba naršyklėje atidarytas `http://`, o ne `https://` |
| Regionas neleidžiamas | Rinkis kitą Europos regioną, bet MySQL ir Web App – tą patį |

---

## Prieš gynimą

- Nemokamas F1 planas **„užmiega“** po ~20 min. be lankytojų, todėl pirmas atsidarymas trunka 20–60 s. **Atsidaryk puslapį likus ~5 min. iki gynimo.**
- Išlaidas gali matyti portale: **Cost Management → Cost analysis**. Kai projekto nebereikės, ištrink visą `fitness-tracker-rg` grupę.

## Kur kas kode (jei paklaus)

| Ką daro | Kur |
|---|---|
| Express atiduoda sukompiliuotą frontend | `backend/src/app.js` (blokas „Publikuotoje versijoje...“) |
| `trust proxy` (Azure HTTPS → `req.protocol = https`) | `backend/src/app.js` |
| SSL prisijungimas prie Azure MySQL | `backend/src/config/database.js` (`DB_SSL`) |
| Frontend kompiliuojamas į `backend/public` | `frontend/vite.config.js` (`build.outDir`) |
| Publikuotas frontend kreipiasi į `/api` | `frontend/.env.production` |
| `secure` cookie production režime | `backend/src/controllers/authController.js` (`cookieOptions`) |
| Publikavimo skriptas | `deploy.ps1` |
| DB perkėlimo skriptas | `backend/scripts/importSql.js` |
