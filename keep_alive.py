#!/usr/bin/env python3
"""
Keep-Alive Service for VSK Dashboard
=====================================

This script pings the VSK Dashboard service periodically to prevent
it from spinning down on Render's free tier.

Usage:
    python keep_alive.py --url https://your-service.onrender.com

The script will ping the service every 10 minutes and log the results.
"""

import argparse
import time
import requests
from datetime import datetime


def check_health(service_url: str) -> bool:
    """Check if the service is healthy"""
    try:
        health_url = f"{service_url}/api/health"
        response = requests.get(health_url, timeout=30)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Service healthy")
            print(f"   Status: {data.get('status')}")
            print(f"   Chunks loaded: {data.get('chunks_loaded')}")
            print(f"   Mode: {data.get('mode')}")
            return True
        else:
            print(f"⚠️  [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] HTTP {response.status_code}")
            return False

    except requests.exceptions.Timeout:
        print(f"⏱️  [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Request timeout - service may be waking up")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error: {e}")
        return False


def wake_up_service(service_url: str) -> bool:
    """Try to wake up the service by hitting the root endpoint"""
    try:
        print(f"🔄 Attempting to wake up service...")
        response = requests.get(service_url, timeout=60)  # Longer timeout for cold start

        if response.status_code == 200:
            print(f"✅ Service woke up successfully")
            return True
        else:
            print(f"⚠️  Service returned HTTP {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Failed to wake up service: {e}")
        return False


def keep_alive(service_url: str, interval: int = 600):
    """
    Keep the service alive by pinging it periodically

    Args:
        service_url: The base URL of the service
        interval: Seconds between pings (default 600 = 10 minutes)
    """
    print(f"🚀 Starting keep-alive service for: {service_url}")
    print(f"⏰ Ping interval: {interval} seconds ({interval // 60} minutes)")
    print(f"📝 Press Ctrl+C to stop\n")

    consecutive_failures = 0
    max_failures = 3

    try:
        while True:
            is_healthy = check_health(service_url)

            if not is_healthy:
                consecutive_failures += 1
                print(f"⚠️  Consecutive failures: {consecutive_failures}/{max_failures}")

                if consecutive_failures >= max_failures:
                    print(f"🔄 Service appears to be down, attempting to wake it up...")
                    wake_up_service(service_url)
                    consecutive_failures = 0

                    # Wait a bit longer after wake-up attempt
                    print(f"⏸️  Waiting 30 seconds for service to fully start...")
                    time.sleep(30)
                    continue
            else:
                consecutive_failures = 0

            # Wait for next ping
            print(f"⏸️  Next ping in {interval} seconds...\n")
            time.sleep(interval)

    except KeyboardInterrupt:
        print(f"\n👋 Keep-alive service stopped by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description="Keep VSK Dashboard service alive on Render free tier"
    )
    parser.add_argument(
        "--url",
        default="https://moe-education-dashboard-backend.onrender.com",
        help="Service URL (default: Render deployment)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=600,
        help="Ping interval in seconds (default: 600 = 10 minutes)"
    )

    args = parser.parse_args()

    # Remove trailing slash from URL
    service_url = args.url.rstrip('/')

    keep_alive(service_url, args.interval)


if __name__ == "__main__":
    main()
