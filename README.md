# MediTrack — Hospital Patient Management System (Full CRUD Web App)

A complete CRUD-based web application built to the SOP: **vanilla HTML/CSS/JavaScript** frontend
talking to a **Django REST Framework** backend, with **mandatory user registration and login**
(token-based auth — there is no default/shared/bypass login; every user must create their own
account and every request to the Patient API requires a valid token).

```
student-management-app/
├── backend/                 Django REST Framework project
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/               settings.py, urls.py, wsgi.py, asgi.py
│   ├── accounts/              register / login / logout endpoints
│   └── patients/               Patient model + CRUD REST API
└── frontend/                 Plain HTML/CSS/JS client
    ├── index.html             Login page
    ├── register.html          Registration page
    ├── dashboard.html          CRUD dashboard (protected)
    ├── css/style.css           colorful teal + coral theme, status-coded badges
    └── js/  config.js, auth.js, api.js, app.js
```

## 1. Prerequisites
- Python 3.10+
- A code editor (VS Code recommended)
- VS Code extension "Live Server" (or any static file server) for the frontend — optional but convenient

## 2. Backend setup (Django REST API)

Open a terminal in `backend/`:

```bash
cd backend

# create & activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# install dependencies
pip install -r requirements.txt

# create the database tables
python manage.py migrate

# (optional) create an admin account for the Django admin site
python manage.py createsuperuser

# run the dev server
python manage.py runserver
```

The API is now live at **http://127.0.0.1:8000/**.

### API endpoints

| Purpose            | Method | Endpoint                     | Auth required |
|---------------------|--------|-------------------------------|---------------|
| Register            | POST   | `/api/auth/register/`         | No            |
| Login               | POST   | `/api/auth/login/`            | No            |
| Logout              | POST   | `/api/auth/logout/`           | Yes           |
| List / search / filter patients | GET | `/api/patients/?search=xyz&status=ADMITTED` | Yes |
| Create patient       | POST   | `/api/patients/`               | Yes           |
| Retrieve one patient  | GET    | `/api/patients/{id}/`          | Yes           |
| Update patient        | PUT/PATCH | `/api/patients/{id}/`       | Yes           |
| Delete patient         | DELETE | `/api/patients/{id}/`          | Yes           |

Patient fields: `patient_id` (unique), `name`, `age`, `gender`, `contact_number`, `email`,
`diagnosis`, `doctor_assigned`, `status` (Admitted / Under Treatment / Discharged), `admission_date`.

All `/api/patients/...` requests must include header:
`Authorization: Token <token-returned-by-login-or-register>`

Django admin site (view raw DB records): **http://127.0.0.1:8000/admin/**

## 3. Frontend setup (vanilla HTML/CSS/JS)

The frontend is plain static files — no build step, no npm install required.

**Option A — VS Code Live Server (recommended)**
1. Open the `frontend/` folder in VS Code.
2. Right-click `index.html` → "Open with Live Server".
3. It will open at something like `http://127.0.0.1:5500/index.html`.

**Option B — Python's built-in server**
```bash
cd frontend
python -m http.server 5500
```
Then visit `http://127.0.0.1:5500/`.

> Keep the Django backend running on port 8000 at the same time. If you change the backend port,
> update `API_BASE_URL` in `frontend/js/config.js` to match.

## 4. Using the app

1. Go to `index.html` → click **Register here** → create your own account (username, email, password).
   There is no default/demo account — you must register first.
2. You're auto-logged-in after registering and redirected to the dashboard, OR log in manually next time on `index.html`.
3. On the dashboard:
   - **Add Patient** — opens a form (Create)
   - Table lists all of your patient records (Read), with a color-coded status badge (blue = Admitted, amber = Under Treatment, green = Discharged)
   - **Edit** — opens the same form pre-filled (Update)
   - **Delete** — asks for confirmation, then removes the record (Delete)
   - **Search box** — filters by name / patient ID / diagnosis / doctor
   - **Status dropdown** — filters the list by Admitted / Under Treatment / Discharged
4. **Logout** clears your session token and returns you to the login page.

## 5. Validation & security notes
- Client-side validation runs on every form (required fields, email format, password match, phone/contact digits, age range, patient ID).
- Server-side validation is enforced independently in DRF serializers (never trust the client alone), including uniqueness checks on username, email, and patient ID.
- Passwords are hashed by Django's `create_user()` — never stored in plaintext.
- Each patient record is scoped to the user (`owner`) who created it — one user cannot see or edit another user's patients.
- Auth uses DRF `TokenAuthentication`; the token is stored in the browser's `localStorage` and sent as `Authorization: Token <key>` on every API call.
- `CORS_ALLOW_ALL_ORIGINS = True` in `settings.py` is for local development convenience only — restrict this to your real frontend origin before deploying.
- Before deploying: move `SECRET_KEY` to an environment variable, set `DEBUG = False`, and set `ALLOWED_HOSTS` properly.

## 6. Testing the API independently (Postman / curl)

```bash
# Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"StrongPass123","password2":"StrongPass123"}'

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"StrongPass123"}'

# Create a patient (replace TOKEN)
curl -X POST http://127.0.0.1:8000/api/patients/ \
  -H "Content-Type: application/json" -H "Authorization: Token TOKEN" \
  -d '{"patient_id":"PT001","name":"Meena Iyer","age":34,"gender":"F","contact_number":"9876501234","email":"meena@example.com","diagnosis":"Fracture","doctor_assigned":"Dr. Suresh","status":"ADMITTED","admission_date":"2026-09-10"}'
```

This project (backend + smoke-tested register → login → create → list/filter → auth-protection flow)
has already been verified to run end-to-end before packaging.
