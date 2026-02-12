const API_BASE = window.API_BASE || 'http://localhost:8000';

async function loadOverview() {
  let data;
  try {
    const res = await fetch(`${API_BASE}/api/analytics/overview`);
    data = await res.json();
  } catch (err) {
    document.getElementById('stats').innerHTML = '<div class="card"><h3>System Notice</h3><p>Backend unavailable. Dashboard is in graceful standby mode.</p></div>';
    return;
  }

  const latestAttendance = data.attendance_trend.at(-1)?.attendance ?? '-';
  const latestApaar = data.apaar_trend.at(-1)?.apaar_ids ?? '-';
  document.getElementById('stats').innerHTML = `
    <div class="card"><h3>Latest Attendance</h3><p>${latestAttendance}%</p></div>
    <div class="card"><h3>Latest APAAR IDs</h3><p>${Number(latestApaar).toLocaleString()}</p></div>
    <div class="card"><h3>Tracked States</h3><p>${data.states.length}</p></div>
  `;

  new Chart(document.getElementById('attendanceChart'), {
    type: 'line',
    data: {
      labels: data.attendance_trend.map(x => x.month),
      datasets: [{ label: 'Attendance %', data: data.attendance_trend.map(x => x.attendance), borderColor: '#0d3b66' }]
    }
  });

  new Chart(document.getElementById('apaarChart'), {
    type: 'bar',
    data: {
      labels: data.apaar_trend.map(x => x.month),
      datasets: [{ label: 'APAAR IDs', data: data.apaar_trend.map(x => x.apaar_ids), backgroundColor: '#2a9d8f' }]
    }
  });
}

async function ask() {
  const query = document.getElementById('query').value;
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    document.getElementById('answer').textContent = data.answer;
    document.getElementById('sources').textContent = `Mode: ${data.mode} | Sources: ${(data.sources || []).join(', ')}`;
  } catch (err) {
    document.getElementById('answer').textContent = 'No relevant information found in the official newsletter data.';
    document.getElementById('sources').textContent = 'Mode: rag_only | Sources: unavailable (backend offline)';
  }
}

document.getElementById('askBtn').addEventListener('click', ask);
loadOverview();
