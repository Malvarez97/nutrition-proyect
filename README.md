# Proyecto Luu

Proyecto React con Vite, Supabase (Auth + Storage), React Router y protección de rutas.

## Estructura

```
src/
├── app/
│   ├── auth/          # Login, registro
│   ├── user/          # Área de usuario (protegida)
│   ├── admin/         # Panel admin (protegido, rol admin)
│   ├── components/    # Componentes de la app
│   ├── HomePage.jsx
│   └── AppLayout.css
├── components/        # Componentes reutilizables
├── hooks/             # useAuth, etc.
├── services/          # auth, supabase
└── lib/               # Configuración (supabase client)
```

## Setup

### 1. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:

- `VITE_SUPABASE_URL`: URL del proyecto (Dashboard → Settings → API)
- `VITE_SUPABASE_ANON_KEY`: Clave anónima pública

### 2. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. En **Authentication** → habilitar **Email** provider
3. En **Storage** → crear bucket `fotos-semanales` (o el nombre que prefieras)
4. En **SQL Editor** → ejecutar en orden: `002_phase1_full_schema.sql`, `003_storage_bucket.sql`, `004_professional_notes.sql`

### 3. Crear primer profesional

Después de registrarte, ejecutar en SQL Editor:

```sql
UPDATE public.profiles
SET role = 'professional'
WHERE id = 'tu-user-id-aqui';
```

### 4. Ejecutar

```bash
npm install
npm run dev
```

## Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Home |
| `/auth/login` | Público | Login |
| `/auth/register` | Público | Registro |
| `/app` | Autenticado | Área de usuario |
| `/admin` | Solo profesional | Panel profesional (pacientes, planes, feedback, reportes) |

## Validación Fase 0

- [x] Usuario puede registrarse
- [x] Usuario puede iniciar sesión
- [x] Rol se guarda en tabla `profiles`
- [x] Rutas `/app/*` protegidas
- [x] Rutas `/admin/*` solo para rol `professional` o `admin`
- [x] Logout funciona
