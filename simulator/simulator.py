"""
Real-Time Sensor Simulator for Crop Monitoring System
======================================================
Simulates live IoT sensors sending data to the backend API.
Generates continuous sensor readings at specified intervals.

Usage:
    python simulator.py --plot 1                    # Simulate for plot 1
    python simulator.py --plot 2 --interval 10      # 10 second intervals
    python simulator.py --plot 1 --drop 30          # Inject 30% moisture drops
    python simulator.py --list                      # List available plots
    python simulator.py --auto                      # Auto-select first plot

Author: Crop Monitoring Team
"""

import requests
import time
import random
import argparse
import sys
from datetime import datetime
from typing import Optional


class SensorSimulator:
    """Simulates real-time IoT sensor data for a plot"""
    
    def __init__(self, plot_id, interval=5, anomaly_rate=0, base_url='http://localhost:8000/api'):
        self.plot_id = plot_id
        self.interval = interval
        self.anomaly_rate = anomaly_rate
        self.base_url = base_url
        
        # Sensor baselines (realistic agricultural values)
        self.moisture = 50.0  # %
        self.temperature = 23.0  # °C
        self.humidity = 65.0  # %
        
        # Variation ranges
        self.moisture_range = (-3, 3)
        self.temp_range = (-2, 2)
        self.humidity_range = (-5, 5)
        
        self.reading_count = 0
        self.start_time = datetime.now()
    
    @staticmethod
    def get_available_plots(base_url='http://localhost:8000/api'):
        """Fetch all available plots from the API"""
        try:
            response = requests.get(f'{base_url}/plots/', timeout=5)
            if response.status_code == 200:
                return response.json()
            return []
        except requests.exceptions.RequestException as e:
            print(f"❌ Cannot connect to backend: {e}")
            print("   Make sure Django server is running at {base_url}")
            return []
    
    def generate_reading(self, sensor_type):
        """Generate a single sensor reading with natural variation"""
        
        # Add natural variation
        if sensor_type == 'MOI':
            variation = random.uniform(*self.moisture_range)
            self.moisture = max(20, min(80, self.moisture + variation))
            
            # Inject anomaly if configured
            if random.random() < (self.anomaly_rate / 100):
                self.moisture -= random.uniform(10, 20)  # Sudden drop
                self.moisture = max(15, self.moisture)
            
            return round(self.moisture, 2)
        
        elif sensor_type == 'TMP':
            variation = random.uniform(*self.temp_range)
            self.temperature = max(10, min(40, self.temperature + variation))
            return round(self.temperature, 2)
        
        elif sensor_type == 'HUM':
            variation = random.uniform(*self.humidity_range)
            self.humidity = max(30, min(95, self.humidity + variation))
            return round(self.humidity, 2)
    
    def send_reading(self, sensor_type, value):
        """Send a sensor reading to the backend API"""
        data = {
            'plot': self.plot_id,
            'sensor_type': sensor_type,
            'value': value,
            'timestamp': datetime.now().isoformat(),
            'source': 'simulator'
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/sensor-readings/',
                json=data,
                timeout=5
            )
            return response.status_code in [200, 201]
        except requests.exceptions.RequestException as e:
            print(f"   ⚠️  Failed to send {sensor_type}: {e}")
            return False
    
    def run_simulation_cycle(self):
        """Run a single simulation cycle (all 3 sensors)"""
        sensors = {
            'MOI': self.generate_reading('MOI'),
            'TMP': self.generate_reading('TMP'),
            'HUM': self.generate_reading('HUM')
        }
        
        success_count = 0
        for sensor_type, value in sensors.items():
            if self.send_reading(sensor_type, value):
                success_count += 1
        
        self.reading_count += success_count
        
        return sensors, success_count == 3
    
    def print_status(self, sensors):
        """Print current sensor values and statistics"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        rate = self.reading_count / elapsed if elapsed > 0 else 0
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Plot {self.plot_id} | "
              f"💧 {sensors['MOI']}% | 🌡️  {sensors['TMP']}°C | 💨 {sensors['HUM']}% | "
              f"Total: {self.reading_count} ({rate:.1f}/s)")
    
    def run(self):
        """Start the continuous simulation"""
        print(f"\n🌾 Real-Time Sensor Simulator")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"Plot ID:      {self.plot_id}")
        print(f"Interval:     {self.interval} seconds")
        print(f"Anomaly Rate: {self.anomaly_rate}% (moisture drops)")
        print(f"Started:      {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"\n🔄 Sending sensor data... (Press Ctrl+C to stop)\n")
        
        try:
            cycle = 0
            while True:
                sensors, success = self.run_simulation_cycle()
                
                if success:
                    self.print_status(sensors)
                
                cycle += 1
                time.sleep(self.interval)
        
        except KeyboardInterrupt:
            self.print_summary()
    
    def print_summary(self):
        """Print final statistics"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        print(f"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"🛑 Simulation Stopped")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"Duration:       {elapsed/60:.1f} minutes")
        print(f"Total Readings: {self.reading_count}")
        print(f"Average Rate:   {self.reading_count/elapsed:.1f} readings/second")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")


def main():
    parser = argparse.ArgumentParser(
        description='Real-time sensor simulator for crop monitoring',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --plot 1                    Simulate sensors for plot 1
  %(prog)s --plot 2 --interval 10      10-second intervals
  %(prog)s --plot 1 --drop 30          30%% chance of moisture anomalies
  %(prog)s --auto                      Auto-select first available plot
  %(prog)s --list                      List all available plots
        """
    )
    
    parser.add_argument('--plot', type=int, help='Plot ID to simulate')
    parser.add_argument('--auto', action='store_true', help='Auto-select first available plot')
    parser.add_argument('--interval', type=int, default=5, help='Seconds between readings (default: 5)')
    parser.add_argument('--drop', type=int, default=0, help='Percentage of moisture drop anomalies (0-100)')
    parser.add_argument('--list', action='store_true', help='List all available plots')
    parser.add_argument('--url', default='http://localhost:8000/api', help='API base URL')
    
    args = parser.parse_args()
    
    # List plots
    if args.list:
        plots = SensorSimulator.get_available_plots(args.url)
        if plots:
            print(f"\n📋 Available Plots ({len(plots)}):\n")
            for plot in plots:
                print(f"   ID {plot['id']}: {plot['name']}")
                print(f"      Farm: {plot.get('farm_name', 'N/A')}")
                print(f"      Crop: {plot['crop_variety']}")
                print(f"      Area: {plot['area_hectares']} ha\n")
        else:
            print("\n❌ No plots found!")
            print("   Create plots via the frontend or Django admin first.\n")
        return
    
    # Auto-select plot
    if args.auto:
        plots = SensorSimulator.get_available_plots(args.url)
        if not plots:
            print("❌ No plots available for auto-selection!")
            sys.exit(1)
        
        plot_id = plots[0]['id']
        print(f"✅ Auto-selected Plot {plot_id}: {plots[0]['name']}\n")
    elif args.plot:
        plot_id = args.plot
        
        # Verify plot exists
        plots = SensorSimulator.get_available_plots(args.url)
        plot_ids = [p['id'] for p in plots]
        
        if plot_id not in plot_ids:
            print(f"❌ Plot {plot_id} not found!")
            print(f"   Available: {plot_ids}")
            print("   Use --list to see all plots\n")
            sys.exit(1)
    else:
        print("❌ Please specify --plot ID or use --auto")
        print("   Use --help for usage information")
        print("   Use --list to see available plots\n")
        sys.exit(1)
    
    # Validate anomaly rate
    if args.drop < 0 or args.drop > 100:
        print("❌ Anomaly rate must be between 0 and 100")
        sys.exit(1)
    
    # Start simulator
    simulator = SensorSimulator(
        plot_id=plot_id,
        interval=args.interval,
        anomaly_rate=args.drop,
        base_url=args.url
    )
    
    simulator.run()


if __name__ == '__main__':
    main()