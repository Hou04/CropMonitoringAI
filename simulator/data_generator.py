"""
Data Generator for Crop Monitoring System
==========================================
Generates historical sensor data for testing and demonstration.
Creates realistic sensor readings over a specified time period.

Usage:
    python data_generator.py --plot 1 --days 7
    python data_generator.py --plot 2 --days 30 --output csv
    python data_generator.py --all  # Generate for all available plots

Author: Crop Monitoring Team
"""

import requests
import argparse
import sys
from datetime import datetime, timedelta
import random
import time
import json


class DataGenerator:
    """Generate historical sensor data for plots"""
    
    def __init__(self, base_url='http://localhost:8000/api'):
        self.base_url = base_url
        self.sensor_types = {
            'MOI': {'name': 'Soil Moisture', 'unit': '%', 'min': 30, 'max': 70, 'baseline': 50},
            'TMP': {'name': 'Temperature', 'unit': '°C', 'min': 15, 'max': 35, 'baseline': 23},
            'HUM': {'name': 'Humidity', 'unit': '%', 'min': 40, 'max': 90, 'baseline': 65}
        }
    
    def get_available_plots(self):
        """Fetch all available plots from the API"""
        try:
            response = requests.get(f'{self.base_url}/plots/', timeout=5)
            if response.status_code == 200:
                plots = response.json()
                return plots if plots else []
            else:
                print(f"❌ Error fetching plots: HTTP {response.status_code}")
                return []
        except requests.exceptions.RequestException as e:
            print(f"❌ Cannot connect to backend: {e}")
            print("   Make sure the Django server is running!")
            return []
    
    def generate_realistic_value(self, sensor_type, base_value=None):
        """Generate a realistic sensor value with natural variation"""
        config = self.sensor_types[sensor_type]
        
        if base_value is None:
            base_value = config['baseline']
        
        # Add random noise and drift
        noise = random.uniform(-3, 3)
        drift = random.uniform(-1, 1)
        
        value = base_value + noise + drift
        
        # Clamp to realistic bounds
        value = max(config['min'], min(config['max'], value))
        
        return round(value, 2), value  # Return both rounded and actual for continuity
    
    def generate_data(self, plot_id, days=7, readings_per_hour=2):
        """
        Generate historical data for a specific plot
        
        Args:
            plot_id: Plot ID to generate data for
            days: Number of days of historical data
            readings_per_hour: How many readings per hour
        """
        total_readings = days * 24 * readings_per_hour
        interval_minutes = 60 / readings_per_hour
        
        print(f"\n📊 Generating Data for Plot {plot_id}")
        print(f"   Period: {days} days ({total_readings} readings per sensor)")
        print(f"   Interval: {interval_minutes} minutes\n")
        
        # Initialize baseline values for smooth transitions
        baselines = {st: config['baseline'] for st, config in self.sensor_types.items()}
        
        created_count = 0
        errors = 0
        
        start_time = datetime.now()
        
        for i in range(total_readings):
            # Calculate timestamp (going backwards in time)
            timestamp = datetime.now() - timedelta(days=days) + timedelta(minutes=i * interval_minutes)
            
            # Generate readings for all sensor types
            for sensor_type in self.sensor_types.keys():
                value, new_baseline = self.generate_realistic_value(sensor_type, baselines[sensor_type])
                baselines[sensor_type] = new_baseline  # Smooth transitions
                
                # Prepare data
                data = {
                    'plot': plot_id,
                    'sensor_type': sensor_type,
                    'value': value,
                    'timestamp': timestamp.isoformat(),
                    'source': 'data_generator'
                }
                
                # Send to API
                try:
                    response = requests.post(
                        f'{self.base_url}/sensor-readings/',
                        json=data,
                        timeout=5
                    )
                    
                    if response.status_code in [200, 201]:
                        created_count += 1
                    else:
                        errors += 1
                        if errors < 5:  # Only show first few errors
                            print(f"   ⚠️  Error: {response.status_code} - {response.text[:100]}")
                    
                except requests.exceptions.RequestException as e:
                    errors += 1
                    if errors < 5:
                        print(f"   ⚠️  Request failed: {e}")
            
            # Progress indicator
            if (i + 1) % 50 == 0:
                progress = ((i + 1) / total_readings) * 100
                print(f"   Progress: {progress:.0f}% ({created_count} readings created)")
        
        elapsed = (datetime.now() - start_time).total_seconds()
        
        print(f"\n✅ Generation Complete!")
        print(f"   Created: {created_count} readings")
        print(f"   Errors: {errors}")
        print(f"   Time: {elapsed:.1f}s")
        print(f"   Rate: {created_count/elapsed:.0f} readings/sec")
        print(f"\n📈 View charts at: http://localhost:5173/plots/{plot_id}\n")
        
        return created_count, errors
    
    def generate_for_all_plots(self, days=7):
        """Generate data for all available plots"""
        plots = self.get_available_plots()
        
        if not plots:
            print("❌ No plots found in the database!")
            print("   Create some plots first via the frontend or Django admin.")
            return
        
        print(f"\n🌾 Found {len(plots)} plot(s)")
        for plot in plots:
            print(f"   • Plot {plot['id']}: {plot['name']} ({plot['crop_variety']})")
        
        print(f"\n📦 Generating {days} days of data for all plots...\n")
        
        total_created = 0
        total_errors = 0
        
        for plot in plots:
            created, errors = self.generate_data(plot['id'], days=days)
            total_created += created
            total_errors += errors
            time.sleep(0.5)  # Brief pause between plots
        
        print(f"\n🎉 All Done!")
        print(f"   Total Created: {total_created} readings")
        print(f"   Total Errors: {total_errors}")


def main():
    parser = argparse.ArgumentParser(
        description='Generate historical sensor data for crop monitoring',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --plot 1 --days 7        Generate 7 days of data for plot 1
  %(prog)s --plot 2 --days 30       Generate 30 days of data for plot 2
  %(prog)s --all --days 14          Generate 14 days for all plots
  %(prog)s --list                   List available plots
        """
    )
    
    parser.add_argument('--plot', type=int, help='Plot ID to generate data for')
    parser.add_argument('--all', action='store_true', help='Generate data for all plots')
    parser.add_argument('--days', type=int, default=7, help='Days of historical data (default: 7)')
    parser.add_argument('--rate', type=int, default=2, help='Readings per hour (default: 2)')
    parser.add_argument('--list', action='store_true', help='List all available plots')
    parser.add_argument('--url', default='http://localhost:8000/api', help='API base URL')
    
    args = parser.parse_args()
    
    generator = DataGenerator(base_url=args.url)
    
    # List plots
    if args.list:
        plots = generator.get_available_plots()
        if plots:
            print(f"\n📋 Available Plots ({len(plots)}):")
            for plot in plots:
                print(f"   ID {plot['id']}: {plot['name']}")
                print(f"      Farm: {plot.get('farm_name', 'N/A')}")
                print(f"      Crop: {plot['crop_variety']}")
                print(f"      Area: {plot['area_hectares']} ha\n")
        else:
            print("❌ No plots found!")
        return
    
    # Generate for all plots
    if args.all:
        generator.generate_for_all_plots(days=args.days)
        return
    
    # Generate for specific plot
    if args.plot:
        # Verify plot exists
        plots = generator.get_available_plots()
        plot_ids = [p['id'] for p in plots]
        
        if args.plot not in plot_ids:
            print(f"❌ Plot {args.plot} not found!")
            print(f"   Available plots: {plot_ids}")
            print("   Use --list to see all plots")
            sys.exit(1)
        
        generator.generate_data(args.plot, days=args.days, readings_per_hour=args.rate)
        return
    
    # No args provided
    print("❌ Please specify --plot ID or --all")
    print("   Use --help for usage information")
    print("   Use --list to see available plots")
    sys.exit(1)


if __name__ == '__main__':
    main()
