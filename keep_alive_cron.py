#!/usr/bin/env python3
"""
Render Cron Job - Keep VSK Dashboard Alive
===========================================

This script runs every 10 minutes via Render Cron Jobs to prevent
the web service from spinning down on the free tier.

Environment Variables:
    SERVICE_URL: The URL of the web service to keep alive
"""

import os
import sys
import requests
from datetime import datetime


def ping_service():
    """Ping the service to keep it alive"""
    service_url = os.getenv("SERVICE_URL", "https://vsk-newsletter.in")

    print(f"{'='*60}")
    print(f"🕐 VSK Dashboard Keep-Alive Cron Job")
    print(f"{'='*60}")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"🌐 Service URL: {service_url}")
    print(f"{'='*60}\n")

    try:
        # Ping the keep-alive endpoint
        keep_alive_url = f"{service_url}/api/keep-alive"
        print(f"📡 Pinging: {keep_alive_url}")

        response = requests.get(keep_alive_url, timeout=60)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS - Service is alive!")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            print(f"   Uptime: {data.get('uptime_seconds', 'N/A')} seconds")
            print(f"   Chunks: {data.get('chunks_loaded', 'N/A')}")
            print(f"   Mode: {data.get('mode', 'N/A')}")
            return 0
        else:
            print(f"⚠️  WARNING - Received HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return 1

    except requests.exceptions.Timeout:
        print(f"⏱️  TIMEOUT - Service is waking up (this is normal after sleep)")
        print(f"   The service will be ready in ~30 seconds")

        # Try one more time after waiting
        print(f"\n🔄 Retrying after 30 seconds...")
        import time
        time.sleep(30)

        try:
            response = requests.get(keep_alive_url, timeout=60)
            if response.status_code == 200:
                print(f"✅ SUCCESS - Service woke up successfully")
                return 0
            else:
                print(f"⚠️  WARNING - Retry returned HTTP {response.status_code}")
                return 1
        except Exception as retry_error:
            print(f"❌ ERROR - Retry failed: {retry_error}")
            return 1

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR - Request failed: {e}")
        return 1

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        print(f"\n{'='*60}")
        print(f"🏁 Cron job completed")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    exit_code = ping_service()
    sys.exit(exit_code)
