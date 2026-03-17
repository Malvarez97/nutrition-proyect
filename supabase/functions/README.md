# Edge Functions

## `create-patient`

Permite a **admin / professional** crear un usuario Auth + perfil paciente desde la app.

---

## Qué hacer para poder crear nuevos pacientes

### 1. Triggers (base de datos)

No tenés que crear triggers a mano. Ya están en las migraciones:

- **`on_auth_user_created`** (en `002_phase1_full_schema.sql` y actualizado en `004_professional_notes.sql`): al insertarse un usuario en `auth.users`, se crea una fila en `public.profiles` con `id`, `role`, `name`, `email`. La Edge Function **create-patient** usa `auth.admin.createUser()`; eso dispara este trigger y después la función hace un **upsert** en `profiles` con nombre, edad, objetivo, etc.

**Qué hacer:** asegurate de tener las migraciones aplicadas en tu proyecto Supabase (local o remoto):

```bash
# Si usás Supabase local
npx supabase db push

# O en el Dashboard de Supabase: SQL Editor → ejecutar las migraciones en orden (001, 002, 003, 004, …) si no usás CLI.
```

Así el trigger existe y al crear un paciente (vía Edge Function) se crea el usuario en Auth, se dispara el trigger y se crea/actualiza el perfil.

### 2. Desplegar la Edge Function `create-patient`

Sin esta función no podés crear pacientes desde la app (solo Auth + trigger no alcanzan; la app llama a la función para usar **service role** y escribir en `profiles`/`goals`).

### 3. Rol de quien crea pacientes

Solo usuarios con rol **professional** o **admin** pueden llamar a `create-patient`. Tu usuario debe tener en `profiles` `role = 'professional'` o `'admin'` (por ejemplo desde el Dashboard → Table Editor → `profiles`).

---

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

- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se inyectan solos al desplegar.
- **Para evitar 401 al crear pacientes:** en los secrets de la función tenés que tener la anon key. Si **SUPABASE_ANON_KEY** ya existe y no podés editarla, añadí una **nueva** con nombre **ANON_KEY** y valor = la anon key del proyecto (la que empieza con `eyJ...`, la misma que en tu `.env`). La función usa cualquiera de las dos. Luego volvé a desplegar: `npx supabase functions deploy create-patient`.

### Invocación

La app llama a `POST /functions/v1/create-patient` con header `Authorization: Bearer <access_token del staff>` y body JSON (email, password, name, age, objective, …).

---

## Si recibís 401 (No autorizado)

1. **Mismo proyecto:** En el `.env` del frontend, `VITE_SUPABASE_URL` debe ser la URL del **mismo** proyecto donde desplegaste la función (ej. `https://xxxx.supabase.co`). La función solo valida JWTs de ese proyecto.

2. **Clave anon correcta:** `VITE_SUPABASE_ANON_KEY` tiene que ser la **anon key** del proyecto (en Dashboard → Project Settings → API → `anon` public). No uses otra clave (ej. “publishable” de otro servicio).

3. **Sesión válida:** Entrá a la app con un usuario que tenga en `profiles` el rol **professional** o **admin**. Si el token venció, cerrando sesión y volviendo a entrar suele corregir el 401.

4. **Re-desplegar la función** después de tocar el código:  
   `npm run functions:deploy` (o `supabase functions deploy create-patient`).

No hace falta correr nada más en tu máquina: la función ya está en Supabase. El 401 se resuelve con proyecto/URL/anon key correctos en el frontend y sesión válida (staff).

---

## "JWT invalid" en create-patient

Ese error suele significar que la **Edge Function está en otro proyecto** que el que usa la app (el JWT lo firma un proyecto y la función lo valida con el otro).

**Hacé esto en orden:**

1. **Mismo proyecto**  
   Tu `.env` tiene `VITE_SUPABASE_URL=https://yuihacxvibtulcgcdjjp.supabase.co`.  
   La función **tiene que estar desplegada en ese mismo proyecto** (ref `yuihacxvibtulcgcdjjp`).

2. **Re-vincular y volver a desplegar** (en la carpeta del proyecto):
   ```bash
   npx supabase link --project-ref yuihacxvibtulcgcdjjp
   npx supabase functions deploy create-patient
   ```
   Así la función usa las variables de **ese** proyecto (y el JWT que envía la app se valida con el mismo secreto).

3. **En Supabase Dashboard** no hace falta activar nada para JWT; ya está habilitado.  
   Solo comprobá: **Project Settings → API** → la "Project URL" es la misma que en tu `.env`.

4. **Cerrar sesión en la app y volver a entrar**, luego probar de nuevo crear paciente (para usar un token nuevo).
