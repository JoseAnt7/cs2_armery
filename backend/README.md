Flask backend for authentication

Setup (Windows):

1. Create a virtual environment and activate it:

```
python -m venv venv
venv\Scripts\Activate.ps1  # PowerShell
venv\Scripts\activate.bat   # cmd
```

2. Install dependencies:

```
pip install -r requirements.txt
```

3. (Optional) Set environment variables in `.env` or system env:

```
JWT_SECRET_KEY=super-secret
DATABASE_URL=mysql+pymysql://user:pass@host/dbname
```

4. Run the app:

```
python app.py
```

The API will run on port 5000 by default.

## Panel de administración (`/admin`)

- Requiere cuenta con `is_admin = true`.
- **Primer administrador:** en `.env` define `ADMIN_BOOTSTRAP_TOKEN=tu_token_secreto` y envía:

  `POST /api/admin/bootstrap` con cabecera `X-Admin-Bootstrap-Token: tu_token_secreto`

  Cuerpo JSON: `{"username":"...","email":"...","password":"..."}` (mín. 8 caracteres). Solo funciona si aún no existe ningún usuario admin.

  La respuesta incluye `access_token` para iniciar sesión.

- **Migración:** al arrancar se añade la columna `is_admin` a `users` si faltaba (SQLite/Postgres vía `db_migrate`).
- **Visitas:** el front envía `POST /api/visits` una vez por pestaña (sessionStorage). Las estadísticas en admin usan fecha UTC (hoy / mes / año en curso).

**Alternativa manual (SQLite):**

```sql
UPDATE users SET is_admin = 1 WHERE id = 1;
```
