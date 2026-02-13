# VSK Dashboard - Reliability & Keep-Alive Guide

## Overview

This document explains how the VSK Dashboard maintains high availability and resilience, even on Render's free tier which spins down services after 15 minutes of inactivity.

## 🛡️ Reliability Features

### 1. Enhanced Health Checks

**Location**: `backend/main.py` - `/api/health` endpoint

The health check endpoint provides comprehensive service status:
- System timestamp
- RAG system initialization status
- Number of chunks loaded
- Service mode (hybrid/rag_only)
- Ready status

**Configuration**: `render.yaml`
```yaml
healthCheckPath: /api/health
```

Render uses this endpoint to:
- Monitor service health
- Automatically restart on failures
- Track uptime metrics

### 2. Graceful Shutdown Handling

**Location**: `backend/main.py` - `lifespan` context manager

Features:
- Proper startup logging with system diagnostics
- Signal handlers for SIGTERM/SIGINT
- Clean resource cleanup on shutdown
- Prevents data corruption during restarts

### 3. Auto-Deploy Configuration

**Location**: `render.yaml`
```yaml
autoDeploy: true
```

Benefits:
- Automatic deployment on git push
- Zero-downtime updates
- Always running latest code

### 4. Optimized Uvicorn Configuration

**Location**: `render.yaml`
```yaml
startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 1 --timeout-keep-alive 75
```

Features:
- `--timeout-keep-alive 75`: Keeps connections alive longer
- `--workers 1`: Single worker optimized for free tier
- Prevents premature connection closures

## 🔄 Keep-Alive Solutions

### Option 1: GitHub Actions (Recommended)

**Location**: `.github/workflows/keep-alive.yml`

**How it works**:
- Runs every 10 minutes automatically
- Pings `/api/health` endpoint
- Wakes up service if it's sleeping
- Retries on failures
- Logs results to GitHub Actions

**Setup**:
1. Already configured in repository
2. Optionally set GitHub secret `SERVICE_URL` to your Render URL
3. Enable GitHub Actions in repository settings

**Manual trigger**:
```bash
# Via GitHub UI: Actions → Keep Service Alive → Run workflow
```

**Benefits**:
- ✅ Completely free
- ✅ No additional infrastructure needed
- ✅ Automatic and reliable
- ✅ Detailed logs in GitHub

### Option 2: Standalone Python Script

**Location**: `keep_alive.py`

**Usage**:
```bash
# Install requests library first
pip install requests

# Run with default settings (pings every 10 minutes)
python keep_alive.py --url https://your-service.onrender.com

# Custom ping interval (5 minutes)
python keep_alive.py --url https://your-service.onrender.com --interval 300
```

**Features**:
- Health monitoring with automatic retries
- Wake-up service on consecutive failures
- Detailed console logging
- Configurable ping intervals

**Use cases**:
- Running on your local machine
- Deploy on a always-on server
- Backup to GitHub Actions

### Option 3: External Monitoring Services

**Free services that can keep your app alive**:

1. **UptimeRobot** (https://uptimerobot.com)
   - 50 monitors free
   - 5-minute check intervals
   - Setup: Add monitor → HTTP(s) → `https://your-service.onrender.com/api/health`

2. **Cron-Job.org** (https://cron-job.org)
   - Unlimited free HTTP requests
   - 1-minute minimum interval
   - Setup: Create job → URL: `https://your-service.onrender.com/api/health`

3. **Better Uptime** (https://betteruptime.com)
   - 10 monitors free
   - 30-second check intervals
   - Setup: Create monitor → HTTP → `https://your-service.onrender.com/api/health`

4. **Freshping** (https://www.freshworks.com/website-monitoring/)
   - 50 checks free
   - 1-minute intervals
   - Setup: Add check → HTTP → Your service URL

## 📊 Monitoring Dashboard

Access your service health:
- **Health endpoint**: `https://your-service.onrender.com/api/health`
- **LLM status**: `https://your-service.onrender.com/api/llm/status`
- **Render dashboard**: https://dashboard.render.com

## 🚀 Deployment Best Practices

### Initial Deployment
```bash
git add .
git commit -m "Add reliability features"
git push origin main
```

### Verify Health
```bash
# Check if service is responding
curl https://your-service.onrender.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": 1234567890.123,
  "rag_initialized": true,
  "mode": "rag_only",
  "chunks_loaded": 150,
  "service": "VSK Dashboard",
  "ready": true
}
```

### Monitor Logs
```bash
# Via Render dashboard:
# 1. Go to https://dashboard.render.com
# 2. Select your service
# 3. Click "Logs" tab
# 4. Look for startup messages:
#    🚀 VSK Dashboard starting up...
#    ✅ RAG system initialized with XXX chunks
```

## ⚡ Cold Start Optimization

**Understanding cold starts**:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Keep-alive prevents cold starts

**Best practices**:
1. Use GitHub Actions keep-alive (automatic)
2. Add external monitoring as backup
3. Optimize startup time by:
   - Lazy loading non-critical resources
   - Caching initialized data
   - Using efficient data structures

## 🔧 Troubleshooting

### Service Not Responding

**Problem**: Health check returns 503 or timeout

**Solutions**:
1. Check Render logs for errors
2. Verify `render.yaml` configuration
3. Manually trigger GitHub Actions workflow
4. Run `keep_alive.py` locally

### Frequent Restarts

**Problem**: Service keeps restarting

**Solutions**:
1. Check memory usage (free tier: 512 MB)
2. Review error logs in Render dashboard
3. Verify all dependencies in `requirements.txt`
4. Ensure health check endpoint is responding

### GitHub Actions Not Running

**Problem**: Keep-alive workflow not executing

**Solutions**:
1. Verify GitHub Actions is enabled in repository settings
2. Check workflow file syntax: `.github/workflows/keep-alive.yml`
3. Manually trigger workflow to test
4. Review Actions logs for errors

## 📈 Performance Metrics

**Expected metrics** (free tier):
- **Cold start time**: 30-60 seconds
- **Warm response time**: 100-500ms
- **Uptime with keep-alive**: 99%+
- **Memory usage**: ~200-300 MB
- **CPU usage**: Low (spikes on requests)

## 🔐 Security Considerations

1. **Health endpoint**: Publicly accessible (safe - no sensitive data)
2. **Keep-alive pings**: Read-only operations
3. **Auto-restart**: Secure - managed by Render
4. **Logs**: No credentials or secrets logged

## 📝 Summary

Your VSK Dashboard now has:
- ✅ Automatic health monitoring
- ✅ Graceful shutdown and restart
- ✅ GitHub Actions keep-alive (every 10 minutes)
- ✅ Standalone keep-alive script option
- ✅ External monitoring service compatibility
- ✅ Optimized Uvicorn configuration
- ✅ Production-ready reliability

**Recommendation**: Enable GitHub Actions and add UptimeRobot as backup for maximum uptime.

---

*Last updated: 2026-02-12*
*VSK Dashboard - Department of School Education & Literacy, Ministry of Education, Government of India*
