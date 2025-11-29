# 🌱 Crop Monitoring Platform
IDEA BY MR BAYYOUDHI CHOUAKI


AI-enhanced crop monitoring system with real-time sensor data analysis, anomaly detection, and automated recommendations.

![Modern Dark Theme](https://img.shields.io/badge/UI-Dark%20Theme-blue?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-5.2-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge)

---

## ✨ Features

- **🔐 JWT Authentication** - Secure login with access/refresh tokens
- **📊 Real-time Dashboard** - Beautiful dark-themed UI with live stats
- **🌾 Farm & Plot Management** - Organize agricultural assets
- **📈 Sensor Data Monitoring** - Temperature, humidity, moisture tracking
- **🤖 AI Anomaly Detection** - Isolation Forest ML algorithm
- **💡 Smart Recommendations** - Automated actionable advice
- **📱 Responsive Design** - Modern, glassmorphism-inspired interface
- **🐳 Docker Ready** - One-command deployment

---

## 🚀 Quick Start

### Option 1: Local Development (SQLite)

**Prerequisites:**
- Python 3.13+
- Node.js 18+
- Pipenv

**Backend:**
```bash
cd backend
pipenv install
pipenv run python manage.py migrate
pipenv run python manage.py createsuperuser
pipenv run python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173

---

### Option 2: Docker Deployment (PostgreSQL)

**Prerequisites:**
- Docker Desktop installed and running

**Setup:**
```bash
# Start all services
docker-compose up --build

# In a new terminal, create superuser
docker-compose exec backend python manage.py createsuperuser
```

**Access:** http://localhost:5173  
**Backend API:** http://localhost:8000/api/

**Stop services:**
```bash
docker-compose down
```

---

## 📋 Default Credentials

After creating a superuser, use those credentials to log in.

**Example:**
- Username: `houcine`
- Password: `hou12345`

---

## 🏗️ Project Structure

```
crop_monitoring/
├── backend/                 # Django REST API
│   ├── agriculture/         # Main app (models, views, serializers)
│   │   ├── models.py        # Database models
│   │   ├── views.py         # API ViewSets with advanced ORM
│   │   ├── serializers.py   # Data serialization
│   │   ├── detector.py      # ML anomaly detection
│   │   └── agent.py         # AI recommendation engine
│   ├── core/                # Django settings
│   ├── Dockerfile           # Backend containerization
│   ├── entrypoint.sh        # Database initialization script
│   └── Pipfile              # Python dependencies
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── pages/           # Dashboard, Login, PlotList, etc.
│   │   ├── components/      # DashboardLayout, etc.
│   │   ├── context/         # AuthContext (JWT management)
│   │   └── services/        # API client (Axios)
│   ├── tailwind.config.js   # Custom dark theme tokens
│   └── package.json
├── simulator/               # Sensor data generator
│   └── simulator.py         # Realistic data + anomaly injection
└── docker-compose.yml       # PostgreSQL + Django orchestration
```

---

## 🔧 Configuration

### Environment Variables

**Backend** (create `backend/.env`):
```env
DATABASE_URL=postgresql://crop_user:crop_password@db:5432/crop_monitoring
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_HOST=db
```

**Frontend** (create `frontend/.env`):
```env
VITE_API_URL=http://localhost:8000/api/
```

See `.env.example` files for templates.

---

## 🎮 Using the Simulator

Generate realistic sensor data with anomaly injection:

```bash
cd simulator

# Basic simulation (30s interval)
python simulator.py

# Fast updates (5s interval)
python simulator.py --interval 5

# Inject moisture drop anomaly
python simulator.py --plot 1 --drop 20

# Inject heat wave
python simulator.py --plot 1 --heat 15

# Progressive drought
python simulator.py --plot 1 --dry 10
```

**Note:** Create at least one plot before running the simulator.

---

## 📚 API Endpoints

### Authentication
- `POST /api/login/` - Login (returns JWT tokens)
- `POST /api/token/refresh/` - Refresh access token

### Core Resources
- `GET/POST /api/farms/` - Farm management
- `GET/POST /api/plots/` - Plot management
- `GET/POST /api/sensor-readings/` - Sensor data
- `GET /api/anomalies/` - Anomaly events (read-only)
- `GET /api/recommendations/` - AI recommendations (read-only)

### Custom Actions
- `GET /api/sensor-readings/statistics/?plot=1&hours=24` - Aggregated stats
- `GET /api/sensor-readings/latest/?plot=1` - Latest readings
- `GET /api/anomalies/recent/?hours=24&limit=5` - Recent anomalies
- `GET /api/anomalies/summary/?hours=168` - Anomaly summary

**Query Parameters:**
- `?plot=1` - Filter by plot ID
- `?sensor_type=MOI` - Filter by sensor type (MOI, TMP, HUM)
- `?hours=24` - Time range in hours
- `?severity=HIGH` - Filter by severity

---

## 🛠️ Development

### Backend Commands

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Shell access
python manage.py shell
```

### Frontend Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🐳 Docker Commands

```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v

# Access backend shell
docker-compose exec backend python manage.py shell

# Run migrations
docker-compose exec backend python manage.py migrate
```

---

## 🎨 UI Theme

**Modern Dark Theme** inspired by high-performance developer tools:

- **Background**: Deep void black (`#02040a`)
- **Cards**: Dark slate (`#0f1623`)
- **Accents**: Electric blue to cyan gradient
- **Typography**: White headings, Slate-400 body text
- **Effects**: Ambient glow, glassmorphism

---

## 🧠 ML & AI Features

### Anomaly Detection
- **Algorithm**: Isolation Forest (scikit-learn)
- **Triggers**: On every sensor reading via Django signals
- **Thresholds**: Configurable contamination factor
- **Types**: LOW_MOISTURE, HIGH_TEMPERATURE, SENSOR_FAILURE

### AI Recommendations
- **Engine**: Rule-based expert system
- **Triggers**: Automatically on anomaly detection
- **Confidence Levels**: HIGH, MEDIUM, LOW
- **Actions**: Irrigation, ventilation, inspection, calibration

---

## 📦 Dependencies

### Backend
- Django 5.2
- Django REST Framework
- djangorestframework-simplejwt
- psycopg2-binary (PostgreSQL)
- dj-database-url
- scikit-learn (ML)
- numpy

### Frontend
- React 18
- React Router DOM
- Axios
- Chart.js (time-series visualization)
- Tailwind CSS
- Lucide React (icons)

---

## 🔒 Security Notes

**For Production:**
1. Change `SECRET_KEY` in `.env`
2. Set `DEBUG=False`
3. Update `ALLOWED_HOSTS`
4. Use strong PostgreSQL password
5. Enable HTTPS
6. Add rate limiting
7. Configure CORS properly

---

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Check database connection
docker-compose logs db
```

### Frontend blank page
```bash
# Check Vite dev server
npm run dev

# Check browser console for errors
# Verify API_URL in .env
```

### Login fails
```bash
# Verify backend is running
curl http://localhost:8000/api/farms/

# Check credentials in database
docker-compose exec backend python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all()
```

---

## 📄 License

MIT License - feel free to use for academic or commercial projects.

---

## 👨‍💻 Author

Built for ISG Tunis 2025 IDEA BY : SIR BAYYOUDHI CHOUAKI - Agricultural Technology Innovation Project

---

## 🙏 Acknowledgments

- Django REST Framework documentation
- React + Vite community
- Chart.js team
- Tailwind CSS
