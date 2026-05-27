# Despliegue en VPS (Hostinger) — SkinAtlas con Docker

Misma estructura que el proyecto **Agentes/VibeUp**: MySQL + backend Flask (Gunicorn) + frontend React (Nginx).

## Puertos (sin conflicto con VibeUp)

| Servicio | VibeUp (Agentes) | SkinAtlas (este repo) |
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
cd /ruta/al/repo   # ej. /root/SkinAtlas
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
| `VPS_DEPLOY_PATH` | Ruta del repo en el VPS (ej. `/root/SkinAtlas`) |
| `VPS_SSH_KEY_PASSPHRASE` | Opcional, si la clave tiene passphrase |

Se dispara con push a `main` o `docker`.

---

## 6) Dominio `skinatlas.es` + Traefik (Hostinger)

### DNS (ya configurado en tu panel)

| Tipo | Nombre | Valor |
|------|--------|--------|
| A | `@` | IP del VPS (ej. `76.12.150.55`) |
| CNAME | `www` | `skinatlas.es` |

Comprueba propagación (mejor que `ping`, el VPS suele bloquear ICMP):

```bash
nslookup skinatlas.es
```

### Traefik

1. En **Administrador de Docker** → **Implementar Traefik** (proyecto en marcha en puertos 80/443).
2. El `docker-compose.yml` de este repo ya incluye **labels Traefik** en `frontend` y la red externa `traefik-proxy`.
3. Requisito extra respecto al ejemplo mínimo de Kodee:
   - `networks: traefik-proxy` (sin esto Traefik no alcanza el contenedor).
   - `traefik.docker.network=traefik-proxy`
   - `tls.certresolver=letsencrypt` (certificado HTTPS automático).
   - Router HTTP aparte que redirige a HTTPS.

Redeploy en el VPS:

```bash
cd /ruta/al/repo
git pull
docker compose up -d --build
```

Prueba:

- `https://skinatlas.es`
- `https://www.skinatlas.es`
- Respaldo directo: `http://IP_VPS:8081`

El puerto **8081** sigue publicado por si quieres depurar; en producción el tráfico web entra por Traefik (80/443).

### Si HTTPS no arranca

- DNS debe resolver a la IP del VPS **antes** de pedir el certificado.
- Traefik desplegado y la red `traefik-proxy` existe: `docker network ls | grep traefik`.
- Logs: `docker logs traefik` (o el nombre del contenedor Traefik en tu VPS).

---

## 7) Hostinger Docker Manager

Si el panel solo hace pull de imágenes y no ejecuta `build`, despliega por **SSH** con los comandos de arriba.
