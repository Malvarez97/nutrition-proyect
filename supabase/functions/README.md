# Edge Functions

## `create-patient`

Permite a **admin / professional** crear un usuario Auth + perfil paciente desde la app.

### Deploy

**Importante:** `npm install -g supabase` **ya no está soportado** (el paquete aborta el postinstall). Usá una de estas opciones:

**A) Homebrew (macOS):**

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
cd /ruta/a/poyecto_luu && supabase functions deploy create-patient
```

**B) Solo con npm en el proyecto (sin global):**

```bash
cd poyecto_luu
npm install
npm run supabase -- login
npm run supabase -- link --project-ref TU_PROJECT_REF
npm run functions:deploy
```

En el dashboard: **Edge Functions** → crear/desplegar `create-patient` pegando el código de `create-patient/index.ts`.

### Secretos

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` suelen inyectarse solos al desplegar en Supabase. Si falla, en **Project Settings → Edge Functions** añadí el service role (solo servidor).

### Invocación

La app llama a `POST /functions/v1/create-patient` con header `Authorization: Bearer <access_token del staff>` y body JSON (email, password, name, age, objective, …).
