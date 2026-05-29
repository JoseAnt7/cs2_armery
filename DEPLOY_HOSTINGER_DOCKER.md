# Despliegue en VPS (Hostinger) — Global Skin Metrics con Docker

Misma estructura que el proyecto **Agentes/VibeUp**: MySQL + backend Flask (Gunicorn) + frontend React (Nginx).

## Puertos (sin conflicto con VibeUp)

| Servicio | VibeUp (Agentes) | Global Skin Metrics (este repo) |
|----------|------------------|------------------------|
| Web HTTP | `80` | **`8081`** (configurable con `HTTP_PORT`) |
| Backend  | solo red Docker  | solo red Docker (`5000`) |
| MySQL    | solo red Docker  | solo red Docker (`3306`) |

Contenedores: `skinatlas-mysql`, `skinatlas-backend`, `skinatlas-frontend`.

---

## Qué incluye

- `docker-compose.yml`: build local en el VPS (sin Docker Hub).
- Volumen `mysql_data` (BD) y `backend_data` (caché del catálogo).

Actualizar:

```bash
docker compose up -d --build
```

El volumen MySQL **no se borra** con ese comando.

---

## 1) Requisitos

- Docker Engine + Docker Compose en el VPS.
- Puerto **8081** abierto (o el que definas en `HTTP_PORT`).

---

## 2) Primera vez en el VPS

```bash
cd /ruta/al/repo   # ej. /root/GlobalSkinMetrics
git clone <tu-repo-github> .
cp .env.example .env
cp backend/.env.example backend/.env
```

Edita `.env`: credenciales `MYSQL_*` y confirma `HTTP_PORT=8081`.

Edita `backend/.env`: `JWT_SECRET_KEY` fuerte y, si quieres, `ADMIN_BOOTSTRAP_TOKEN`.

Levantar:

```bash
docker compose up -d --build
```

Comprobar:

```bash
docker compose ps
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/
```

La app quedará en `http://TU_IP:8081` (o detrás de un proxy inverso en el host).

---

## 3) Actualizar tras cambios

```bash
git pull
docker compose up -d --build
```

---

## 4) Primer administrador

Con `ADMIN_BOOTSTRAP_TOKEN` en `backend/.env`:

```bash
curl -X POST http://127.0.0.1:8081/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Admin-Bootstrap-Token: tu_token" \
  -d '{"username":"admin","email":"tu@email.com","password":"tu_password_seguro"}'
```

---

## 5) Deploy automático (GitHub Actions)

Workflow: `.github/workflows/deploy-vps.yml`

Secretos en GitHub → Settings → Secrets → Actions:

| Secreto | Descripción |
|---------|-------------|
| `VPS_HOST` | IP o dominio del VPS |
| `VPS_USER` | Usuario SSH |
| `VPS_SSH_PRIVATE_KEY` | Clave privada SSH |
| `VPS_DEPLOY_PATH` | Ruta del repo en el VPS (ej. `/root/GlobalSkinMetrics`) |
| `VPS_SSH_KEY_PASSPHRASE` | Opcional, si la clave tiene passphrase |

Se dispara con push a `main` o `docker`.

---

## 6) HTTPS y dominio

Producción: **https://globalskinmetrics.com** (y `www.globalskinmetrics.com`).

Traefik en el VPS enruta el dominio al contenedor `frontend` (labels en `docker-compose.yml`). Apunta los registros **A** de `globalskinmetrics.com` y `www` a la IP del VPS.

Alternativas:

- Nginx en el **host** que escuche en 443 y haga proxy a `127.0.0.1:8081`.
- Cloudflare delante del VPS.

---

## 7) Hostinger Docker Manager

Si el panel solo hace pull de imágenes y no ejecuta `build`, despliega por **SSH** con los comandos de arriba.
