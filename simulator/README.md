# Sensor Simulation Tools

This directory contains tools for generating and simulating sensor data for the Crop Monitoring System.

## 📁 Files

### `data_generator.py` - Historical Data Generation
Generates bulk historical sensor data for testing charts and demonstrations.

**Purpose:** Create realistic sensor data over a time period (days/weeks)  
**Use Case:** Initial setup, demos, populating charts

**Examples:**
```bash
# List available plots
python data_generator.py --list

# Generate 7 days of data for plot 1
python data_generator.py --plot 1 --days 7

# Generate 30 days for all plots
python data_generator.py --all --days 30

# Generate with custom rate (4 readings/hour)
python data_generator.py --plot 2 --days 14 --rate 4
```

---

### `simulator.py` - Real-Time Simulation
Simulates live IoT sensors sending continuous data streams.

**Purpose:** Mimic real sensor hardware in production  
**Use Case:** Development, testing real-time features, anomaly detection

**Examples:**
```bash
# List available plots
python simulator.py --list

# Simulate sensors for plot 1 (5s intervals)
python simulator.py --plot 1

# Custom interval (10 seconds)
python simulator.py --plot 2 --interval 10

# Include anomalies (30% moisture drops)
python simulator.py --plot 1 --drop 30

# Auto-select first available plot
python simulator.py --auto
```

---

## 🎯 Quick Start Guide

### 1. **Setup (First Time)**
Make sure Django backend is running:
```bash
cd ../backend
pipenv run python manage.py runserver
```

### 2. **Generate Historical Data (For Charts)**
```bash
# Generate 7 days of data for all plots
python data_generator.py --all --days 7
```

Now your charts will display historical trends!

### 3. **Start Real-Time Simulation (Optional)**
```bash
# Simulate live sensors for plot 1
python simulator.py --plot 1
```

Leave this running to continuously update sensor data.

---

## 📊 Data Flow

```
┌─────────────────────┐
│  data_generator.py  │  Historical bulk data
│  (one-time)         │  ────────────────┐
└─────────────────────┘                  │
                                         ▼
                              ┌──────────────────────┐
┌─────────────────────┐       │   Django Backend     │
│   simulator.py      │       │   /api/sensor-       │
│   (continuous)      │ ────▶ │   readings/          │
└─────────────────────┘       └──────────────────────┘
                                         │
       Real-time data stream             │
                                         ▼
                              ┌──────────────────────┐
                              │   React Frontend     │
                              │   - Charts           │
                              │   - Anomaly Display  │
                              └──────────────────────┘
```

---

## 🔧 Troubleshooting

### "Cannot connect to backend"
- Ensure Django server is running: `pipenv run python manage.py runserver`
- Check URL: Default is `http://localhost:8000/api`

### "No plots found"
- Create plots via frontend (http://localhost:5173/plots)
- Or use Django admin (http://localhost:8000/admin)

### Charts show "No data available"
- Run `data_generator.py --all --days 7` to populate data
- Check that you're viewing the correct plot ID

---

## 💡 Tips

- Use `data_generator.py` for **one-time** chart population
- Use `simulator.py` for **continuous** testing during development
- Start `simulator.py` with `--drop 30` to test anomaly detection
- Use `--list` flag to see all available plots before running

---

## 📝 Notes

- Both tools auto-detect available plots from the backend
- Data is sent to the same API endpoints real IoT sensors would use
- Source is tagged as 'data_generator' or 'simulator' for tracking
