// script.js
// ===================== GLOBAL STATE & UTILITIES =====================
let currentData = [];
let dataTitle = "Data";

// Prevent JavaScript IEEE-754 floating point errors
function cleanFloat(num) {
  return Math.round(num * 1000000) / 1000000;
}

// ===================== NAVIGATION =====================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const section = document.getElementById('sec-' + id);
  if (section) section.classList.add('active');

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'" + id + "'")) {
      n.classList.add('active');
    }
  });

  closeSidebar();
  window.scrollTo(0, 0);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

function switchTab(btn, tabId) {
  const tabBar = btn.parentElement;
  const card = tabBar.parentElement;

  tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  card.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
}

// ===================== DATA PROCESSING =====================
function parseData(text) {
  return text.replace(/\n/g, ',').split(/[\s,]+/)
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));
}

function processData() {
  const input = document.getElementById('dataInput').value;
  currentData = parseData(input);
  dataTitle = document.getElementById('dataTitle').value || 'Data';

  if (currentData.length === 0) {
    alert('Please enter valid numerical data.');
    return;
  }

  const sorted = [...currentData].sort((a, b) => a - b);
  const preview = document.getElementById('dataPreview');
  preview.innerHTML = `
    <div class="info-box tip" style="margin-top:16px;">
      <strong>✅ Data loaded successfully!</strong><br>
      <strong>Title:</strong> ${dataTitle}<br>
      <strong>Count (N):</strong> ${currentData.length} observations<br>
      <strong>Sorted:</strong> ${sorted.join(', ')}<br>
      <strong>Range:</strong> ${sorted[0]} to ${sorted[sorted.length - 1]}
    </div>
  `;
}

function loadSampleData(type) {
  let data, title;
  switch(type) {
    case 'exam':
      data = '45, 67, 82, 55, 91, 73, 68, 77, 85, 60, 72, 88, 53, 79, 65, 70, 74, 81, 58, 76';
      title = 'Math Exam Scores';
      break;
    case 'height':
      data = '155.5, 162.1, 168.0, 171.4, 158.2, 175.9, 163.5, 169.1, 172.8, 160.0, 167.3, 174.5, 159.9, 165.4, 170.2, 173.1, 161.7, 166.8, 176.0, 164.2';
      title = 'Student Heights (cm)';
      break;
    case 'temperature':
      data = '28.1, 30.2, 31.0, 29.5, 32.1, 33.4, 30.0, 31.8, 34.2, 29.1, 31.5, 32.6, 30.9, 33.0, 35.1, 28.8, 31.2, 32.0, 30.5, 34.0';
      title = 'Daily Temperature (°C)';
      break;
    case 'small':
      data = '3, 5, 7, 2, 8, 5, 4, 6, 5, 3, 7, 4, 5, 6, 8';
      title = 'Small Data Set';
      break;
  }

  document.getElementById('dataInput').value = data;
  document.getElementById('dataTitle').value = title;
  processData();
  showSection('data-input');
}

function ensureData() {
  if (currentData.length === 0) {
    const input = document.getElementById('dataInput').value;
    currentData = parseData(input);
    dataTitle = document.getElementById('dataTitle').value || 'Data';
  }
  if (currentData.length === 0) {
    alert('Please enter data first in the Data Input section.');
    return false;
  }
  return true;
}

// ===================== STATISTICAL FUNCTIONS =====================
function calcMean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function calcMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2 === 1) return sorted[Math.floor(n / 2)];
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

function calcMode(arr) {
  const freq = {};
  arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const maxFreq = Math.max(...Object.values(freq));
  if (maxFreq === 1) return { modes: [], freq: 1, text: 'No mode (all values unique)' };
  const modes = Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number);
  return { modes, freq: maxFreq, text: modes.join(', ') + ' (freq: ' + maxFreq + ')' };
}

function calcQ1(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const lower = sorted.slice(0, Math.floor(n / 2));
  return calcMedian(lower);
}

function calcQ3(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const upper = sorted.slice(n % 2 === 1 ? Math.floor(n / 2) + 1 : Math.floor(n / 2));
  return calcMedian(upper);
}

function calcVariance(arr) {
  const mean = calcMean(arr);
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}

function calcSD(arr) {
  return Math.sqrt(calcVariance(arr));
}

// ===================== RIGOROUS GROUPING LOGIC =====================
function getGroupedData(classWidth, startVal) {
  const sorted = [...currentData].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  const start = (startVal !== null && !isNaN(startVal)) ? startVal : Math.floor(min / classWidth) * classWidth;

  const groups = [];
  let currentLower = start;

  while (currentLower <= max) {
    let currentUpper = cleanFloat(currentLower + classWidth);
    let midVal = cleanFloat((currentLower + currentUpper) / 2);
    
    let count = sorted.filter(v => cleanFloat(v) >= currentLower && cleanFloat(v) < currentUpper).length;
    
    // Strict catch-all for the absolute maximum value
    if (currentUpper === max) {
      count = sorted.filter(v => cleanFloat(v) >= currentLower && cleanFloat(v) <= currentUpper).length;
    }

    groups.push({ lower: currentLower, upper: currentUpper, midVal: midVal, freq: count });
    currentLower = currentUpper;
  }
  return groups;
}

// ===================== FREQUENCY TABLES =====================
function generateUngroupedTable() {
  if (!ensureData()) return;
  const sorted = [...currentData].sort((a, b) => a - b);
  const freq = {};
  sorted.forEach(v => freq[v] = (freq[v] || 0) + 1);

  const keys = Object.keys(freq).map(Number).sort((a, b) => a - b);
  let html = `<h3>Ungrouped Frequency Table — ${dataTitle}</h3>`;
  html += '<table><tr><th>Value (x)</th><th>Tally</th><th>Frequency (f)</th></tr>';

  keys.forEach(k => {
    const f = freq[k];
    html += `<tr><td>${k}</td><td style="font-family:monospace;text-align:left;padding-left:20px;">${makeTally(f)}</td><td>${f}</td></tr>`;
  });

  html += `<tr style="font-weight:bold;"><td>Total (&Sigma;)</td><td></td><td>N = ${currentData.length}</td></tr></table>`;
  document.getElementById('ungroupedTableOutput').innerHTML = html;
}

function makeTally(n) {
  let t = '';
  const groups = Math.floor(n / 5);
  const rem = n % 5;
  for (let i = 0; i < groups; i++) t += '<span style="text-decoration:line-through;">||||</span> ';
  t += '|'.repeat(rem);
  return t;
}

function generateGroupedTable() {
  if (!ensureData()) return;
  const classWidth = parseFloat(document.getElementById('classWidth').value) || 10;
  const startInput = document.getElementById('classStart').value;
  const startVal = startInput ? parseFloat(startInput) : null;

  const groups = getGroupedData(classWidth, startVal);

  let html = `<h3>Grouped Frequency Table — ${dataTitle}</h3>`;
  html += '<table><tr><th>Class Interval (Inequality)</th><th>Mid-value (x)</th><th>Frequency (f)</th><th>f &times; x</th></tr>';

  let totalF = 0, totalFX = 0;
  groups.forEach(g => {
    totalF += g.freq;
    const fx = cleanFloat(g.freq * g.midVal);
    totalFX += fx;
    html += `<tr><td>${g.lower} &le; x &lt; ${g.upper}</td><td>${g.midVal}</td><td>${g.freq}</td><td>${fx.toFixed(1)}</td></tr>`;
  });

  html += `<tr style="font-weight:bold;"><td>Total (&Sigma;)</td><td></td><td>&Sigma;f = ${totalF}</td><td>&Sigma;fx = ${totalFX.toFixed(1)}</td></tr></table>`;

  const groupedMean = totalFX / totalF;
  html += `<div class="info-box info"><strong>Estimated Mean (grouped) = &Sigma;fx / &Sigma;f = ${totalFX.toFixed(1)} / ${totalF} = ${groupedMean.toFixed(2)}</strong></div>`;

  document.getElementById('groupedTableOutput').innerHTML = html;
}

function generateCumulativeTable() {
  if (!ensureData()) return;
  const classWidth = parseFloat(document.getElementById('classWidth')?.value) || 10;
  const groups = getGroupedData(classWidth, null);

  let html = `<h3>Cumulative Frequency Table — ${dataTitle}</h3>`;
  html += '<table><tr><th>Class Interval</th><th>Upper Boundary (x &lt; U)</th><th>Frequency (f)</th><th>Cumulative Frequency (CF)</th></tr>';

  let cf = 0;
  groups.forEach(g => {
    cf += g.freq;
    html += `<tr><td>${g.lower} &le; x &lt; ${g.upper}</td><td>x &lt; ${g.upper}</td><td>${g.freq}</td><td>${cf}</td></tr>`;
  });
  html += '</table>';

  const n = currentData.length;
  if(cf !== n) console.warn(`Data Integrity Warning: CF (${cf}) does not match Total N (${n}). Check class boundaries.`);

  html += `<div class="info-box info">
    <strong>Reading from the table:</strong><br>
    Total N = ${n}<br>
    Median position: N/2 = ${cleanFloat(n/2)}<br>
    Lower Quartile (Q1) position: N/4 = ${cleanFloat(n/4)}<br>
    Upper Quartile (Q3) position: 3N/4 = ${cleanFloat(3*n/4)}
  </div>`;

  document.getElementById('cumulativeTableOutput').innerHTML = html;
}

// ===================== BAR GRAPH =====================
function drawBarGraph() {
  if (!ensureData()) return;
  const canvas = document.getElementById('barGraphCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 700; canvas.height = 400; ctx.clearRect(0, 0, 700, 400);

  const freq = {}; currentData.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const keys = Object.keys(freq).map(Number).sort((a, b) => a - b);
  const maxFreq = Math.max(...Object.values(freq));

  const margin = { top: 40, right: 30, bottom: 60, left: 60 }, w = 700 - margin.left - margin.right, h = 400 - margin.top - margin.bottom, barWidth = Math.min(40, (w / keys.length) * 0.7), gap = (w / keys.length) * 0.3;

  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 400);
  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(dataTitle + ' — Bar Graph', 350, 25);
  ctx.font = '12px Segoe UI'; ctx.textAlign = 'right';

  for (let i = 0; i <= maxFreq; i++) {
    const y = margin.top + h - (i / maxFreq) * h;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(700 - margin.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.fillText(i, margin.left - 8, y + 4);
  }

  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
  keys.forEach((k, i) => {
    const x = margin.left + i * (w / keys.length) + gap / 2, barH = (freq[k] / maxFreq) * h, y = margin.top + h - barH;
    ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(x, y, barWidth, barH);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.strokeRect(x, y, barWidth, barH);
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(freq[k], x + barWidth / 2, y - 5);
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.fillText(k, x + barWidth / 2, margin.top + h + 20);
  });

  ctx.fillStyle = '#1e293b'; ctx.font = '13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Value (x)', 350, 390);
  ctx.save(); ctx.translate(15, 200); ctx.rotate(-Math.PI / 2); ctx.fillText('Frequency (f)', 0, 0); ctx.restore();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + h); ctx.lineTo(700 - margin.right, margin.top + h); ctx.stroke();
}

// ===================== PICTOGRAM =====================
function drawPictogram() {
  const input = document.getElementById('pictogramInput').value, scale = parseInt(document.getElementById('pictogramScale').value) || 5, symbol = document.getElementById('pictogramSymbol').value;
  const lines = input.trim().split('\n').filter(l => l.trim()), data = lines.map(l => { const parts = l.split(','); return { label: parts[0].trim(), value: parseInt(parts[1]) }; }).filter(d => !isNaN(d.value));
  if (data.length === 0) return;

  let html = `<h3>Pictogram</h3><div style="margin-bottom:10px;"><strong>Key:</strong> ${symbol} = ${scale}</div><div style="background:#f8fafc; padding:16px; border-radius:8px; border:1px solid var(--border);">`;
  data.forEach(d => {
    const fullSymbols = Math.floor(d.value / scale), remainder = d.value % scale; let icons = symbol.repeat(fullSymbols);
    if (remainder > 0) { const fraction = remainder / scale; if (fraction >= 0.75) icons += symbol; else if (fraction >= 0.25) icons += '◐'; }
    html += `<div class="pictogram-row"><span class="pictogram-label">${d.label}</span><span class="pictogram-icons">${icons}</span><span style="color:var(--text-light);font-size:0.85rem;margin-left:10px;">(${d.value})</span></div>`;
  });
  html += '</div>'; document.getElementById('pictogramOutput').innerHTML = html;
}

// ===================== LINE GRAPH =====================
function drawLineGraph() {
  const input = document.getElementById('lineGraphInput').value, lines = input.trim().split('\n').filter(l => l.trim()), data = lines.map(l => { const parts = l.split(','); return { label: parts[0].trim(), value: parseFloat(parts[1]) }; }).filter(d => !isNaN(d.value));
  if (data.length === 0) return;

  const canvas = document.getElementById('lineGraphCanvas'), ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 400; ctx.clearRect(0, 0, 700, 400);
  const margin = { top: 40, right: 30, bottom: 60, left: 60 }, w = 700 - margin.left - margin.right, h = 400 - margin.top - margin.bottom, values = data.map(d => d.value), minVal = Math.min(...values) * 0.9, maxVal = Math.max(...values) * 1.1;

  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 400); ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Line Graph', 350, 25);

  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = margin.top + h - (i / ySteps) * h, val = minVal + (i / ySteps) * (maxVal - minVal);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(700 - margin.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'right'; ctx.fillText(val.toFixed(1), margin.left - 8, y + 4);
  }

  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.beginPath();
  const points = data.map((d, i) => ({ x: margin.left + (i / (data.length - 1)) * w, y: margin.top + h - ((d.value - minVal) / (maxVal - minVal)) * h }));
  points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();

  points.forEach((p, i) => {
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(data[i].value, p.x, p.y - 12);
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.fillText(data[i].label, p.x, margin.top + h + 20);
  });
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + h); ctx.lineTo(700 - margin.right, margin.top + h); ctx.stroke();
}

// ===================== PIE CHART =====================
function drawPieChart() {
  const input = document.getElementById('pieChartInput').value, lines = input.trim().split('\n').filter(l => l.trim()), data = lines.map(l => { const parts = l.split(','); return { label: parts[0].trim(), value: parseFloat(parts[1]) }; }).filter(d => !isNaN(d.value));
  if (data.length === 0) return;

  const canvas = document.getElementById('pieChartCanvas'), ctx = canvas.getContext('2d'); canvas.width = 500; canvas.height = 500; ctx.clearRect(0, 0, 500, 500);
  const total = data.reduce((s, d) => s + d.value, 0), cx = 250, cy = 240, r = 180, colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 500, 500); ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Pie Chart', 250, 25);
  let startAngle = -Math.PI / 2, legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:12px;margin:10px 0;">';

  data.forEach((d, i) => {
    const angle = (d.value / total) * Math.PI * 2, endAngle = startAngle + angle;
    ctx.fillStyle = colors[i % colors.length]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, endAngle); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    const midAngle = startAngle + angle / 2, labelR = r * 0.65, lx = cx + Math.cos(midAngle) * labelR, ly = cy + Math.sin(midAngle) * labelR, pct = ((d.value / total) * 100).toFixed(1), deg = ((d.value / total) * 360).toFixed(1);
    if (angle > 0.2) { ctx.fillStyle = 'white'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(pct + '%', lx, ly); ctx.font = '10px Segoe UI'; ctx.fillText(deg + '°', lx, ly + 14); }
    legendHtml += `<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;background:${colors[i % colors.length]};border-radius:3px;"></div><span style="font-size:0.85rem;">${d.label}: ${d.value} (${pct}%, ${deg}°)</span></div>`;
    startAngle = endAngle;
  });
  legendHtml += '</div>'; document.getElementById('pieChartLegend').innerHTML = legendHtml;
}

function calculatePieAngles() {
  const input = document.getElementById('pieChartInput').value, lines = input.trim().split('\n').filter(l => l.trim()), data = lines.map(l => { const parts = l.split(','); return { label: parts[0].trim(), value: parseFloat(parts[1]) }; }).filter(d => !isNaN(d.value));
  if (data.length === 0) return;
  const total = data.reduce((s, d) => s + d.value, 0);
  let html = '<table><tr><th>Category</th><th>Value (f)</th><th>Fraction</th><th>Angle (°)</th><th>Percentage (%)</th></tr>';
  data.forEach(d => { const frac = d.value / total; html += `<tr><td>${d.label}</td><td>${d.value}</td><td>${d.value}/${total}</td><td>${(frac * 360).toFixed(1)}°</td><td>${(frac * 100).toFixed(1)}%</td></tr>`; });
  html += `<tr style="font-weight:bold;"><td>Total (&Sigma;)</td><td>${total}</td><td>1</td><td>360°</td><td>100%</td></tr></table>`;
  document.getElementById('pieAngleResult').innerHTML = html;
}

// ===================== DOT DIAGRAM =====================
function drawDotDiagram() {
  if (!ensureData()) return;
  const canvas = document.getElementById('dotDiagramCanvas'), ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 300; ctx.clearRect(0, 0, 700, 300);
  const sorted = [...currentData].sort((a, b) => a - b), min = sorted[0], max = sorted[sorted.length - 1], freq = {}; sorted.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const maxFreq = Math.max(...Object.values(freq)), uniqueVals = Object.keys(freq).map(Number).sort((a, b) => a - b);
  const margin = { top: 30, right: 30, bottom: 50, left: 50 }, w = 700 - margin.left - margin.right, h = 300 - margin.top - margin.bottom;

  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 300); ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(dataTitle + ' — Dot Diagram', 350, 20);
  const lineY = margin.top + h; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(margin.left, lineY); ctx.lineTo(700 - margin.right, lineY); ctx.stroke();
  const dotR = Math.min(10, (h - 20) / maxFreq / 2, w / uniqueVals.length / 2.5);

  uniqueVals.forEach(v => {
    const x = margin.left + ((v - min) / (max - min || 1)) * w;
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, lineY); ctx.lineTo(x, lineY + 8); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(v, x, lineY + 22);
    for (let i = 0; i < freq[v]; i++) {
      const y = lineY - dotR - 2 - (i * (dotR * 2 + 2));
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke();
    }
  });
}

// ===================== HISTOGRAM =====================
function drawHistogram() {
  if (!ensureData()) return;
  const classWidth = parseFloat(document.getElementById('histClassWidth').value) || 10, groups = getGroupedData(classWidth, null);
  const canvas = document.getElementById('histogramCanvas'), ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 400; ctx.clearRect(0, 0, 700, 400);

  const maxFreq = Math.max(...groups.map(g => g.freq)), margin = { top: 40, right: 30, bottom: 60, left: 60 }, w = 700 - margin.left - margin.right, h = 400 - margin.top - margin.bottom;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 400); ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(dataTitle + ' — Histogram (Continuous Classes)', 350, 25);

  for (let i = 0; i <= maxFreq; i++) {
    const y = margin.top + h - (i / maxFreq) * h; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(700 - margin.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'right'; ctx.fillText(i, margin.left - 8, y + 4);
  }

  const barW = w / groups.length, colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#3b82f6', '#60a5fa', '#93c5fd', '#3b82f6'];
  groups.forEach((g, i) => {
    const x = margin.left + i * barW, barH = (g.freq / maxFreq) * h, y = margin.top + h - barH;
    ctx.fillStyle = colors[i % colors.length] + 'cc'; ctx.fillRect(x, y, barW, barH); ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 1; ctx.strokeRect(x, y, barW, barH);
    if (g.freq > 0) { ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(g.freq, x + barW / 2, y - 5); }
    ctx.fillStyle = '#64748b'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(`[${g.lower}, ${g.upper})`, x + barW / 2, margin.top + h + 20);
  });

  ctx.fillStyle = '#1e293b'; ctx.font = '13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Class Interval Limits', 350, 395);
  ctx.save(); ctx.translate(15, 200); ctx.rotate(-Math.PI / 2); ctx.fillText('Frequency (f)', 0, 0); ctx.restore();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + h); ctx.lineTo(700 - margin.right, margin.top + h); ctx.stroke();
}

// ===================== STEM AND LEAF =====================
function drawStemLeaf() {
  if (!ensureData()) return;
  const sorted = [...currentData].sort((a, b) => a - b), stems = {};
  sorted.forEach(v => { const stem = Math.floor(v / 10), leaf = Math.round(v % 10); if (!stems[stem]) stems[stem] = []; stems[stem].push(leaf); });
  const stemKeys = Object.keys(stems).map(Number).sort((a, b) => a - b);
  for (let s = stemKeys[0]; s <= stemKeys[stemKeys.length - 1]; s++) { if (!stems[s]) stems[s] = []; }

  const allKeys = []; for (let s = stemKeys[0]; s <= stemKeys[stemKeys.length - 1]; s++) allKeys.push(s);
  let html = `<h3>Stem-and-Leaf Diagram — ${dataTitle}</h3><div class="stem-leaf-display"><div style="font-weight:700; margin-bottom:8px; color:var(--text-light);">Stem | Leaf</div>`;
  allKeys.forEach(s => { const leaves = (stems[s] || []).sort((a, b) => a - b); html += `<div class="stem-leaf-row"><span class="stem-val">${s}</span><span class="leaf-vals">${leaves.join(' ')}</span></div>`; });
  html += `</div><div class="info-box info"><strong>Key:</strong> ${allKeys[0]} | ${stems[allKeys[0]][0] || 0} means ${allKeys[0]}${stems[allKeys[0]][0] || 0}</div>`;
  document.getElementById('stemLeafOutput').innerHTML = html;

  const n = sorted.length, mean = calcMean(sorted), median = calcMedian(sorted), mode = calcMode(sorted);
  let statsHtml = `<div class="stats-grid"><div class="stat-result"><span class="label">N</span><span class="value">${n}</span></div><div class="stat-result"><span class="label">Mean</span><span class="value">${mean.toFixed(2)}</span></div><div class="stat-result"><span class="label">Median</span><span class="value">${median}</span></div><div class="stat-result"><span class="label">Mode</span><span class="value">${mode.text}</span></div></div>`;
  document.getElementById('stemLeafStats').innerHTML = statsHtml;
}

// ===================== CUMULATIVE FREQUENCY =====================
function drawCumulativeFrequency() {
  if (!ensureData()) return;
  const classWidth = parseFloat(document.getElementById('cfClassWidth').value) || 10;
  const groups = getGroupedData(classWidth, null);

  const canvas = document.getElementById('cfCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 700;
  canvas.height = 450;
  ctx.clearRect(0, 0, 700, 450);

  let cf = 0; 
  const cfPoints = [{ x: groups[0].lower, y: 0 }];
  groups.forEach(g => { 
    cf += g.freq; 
    cfPoints.push({ x: g.upper, y: cf }); 
  });

  const n = cf;
  const xMin = cfPoints[0].x;
  const xMax = cfPoints[cfPoints.length - 1].x;

  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const w = 700 - margin.left - margin.right;
  const h = 450 - margin.top - margin.bottom;

  ctx.fillStyle = '#f8fafc'; 
  ctx.fillRect(0, 0, 700, 450); 
  ctx.fillStyle = '#1e293b'; 
  ctx.font = 'bold 16px Segoe UI'; 
  ctx.textAlign = 'center'; 
  ctx.fillText(dataTitle + ' — Cumulative Frequency Curve', 350, 25);
  
  function toCanvasX(val) { return margin.left + ((val - xMin) / (xMax - xMin)) * w; } 
  function toCanvasY(val) { return margin.top + h - (val / n) * h; }

  // 1. Draw Background Grid
  for (let i = 0; i <= 5; i++) {
    const yVal = (i / 5) * n, y = toCanvasY(yVal); 
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; 
    ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(700 - margin.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'right'; 
    ctx.fillText(Math.round(yVal), margin.left - 8, y + 4);
  }

  // 2. Draw X-axis Interval Marks
  cfPoints.forEach(p => { 
    const x = toCanvasX(p.x); 
    ctx.strokeStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + h); ctx.stroke(); 
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'center'; 
    ctx.fillText(p.x, x, margin.top + h + 20); 
  });

  // 3. MATH: Fritsch-Carlson Monotone Cubic Spline (Prevents all waving/rippling)
  let deltas = [], m = [];
  // Calculate slopes between points
  for(let i=0; i<cfPoints.length-1; i++) {
      let dx = cfPoints[i+1].x - cfPoints[i].x;
      deltas.push((cfPoints[i+1].y - cfPoints[i].y) / (dx === 0 ? 1 : dx));
  }
  // Estimate tangents at each point
  m.push(deltas[0]);
  for(let i=1; i<cfPoints.length-1; i++) {
      if(deltas[i-1] * deltas[i] <= 0) m.push(0);
      else m.push((deltas[i-1] + deltas[i]) / 2);
  }
  m.push(deltas[deltas.length-1]);

  // Clamp tangents to strictly force a monotonic S-Curve
  for(let i=0; i<cfPoints.length-1; i++) {
      if (deltas[i] === 0) {
          m[i] = 0; m[i+1] = 0;
      } else {
          let alpha = m[i] / deltas[i];
          let beta = m[i+1] / deltas[i];
          if (alpha*alpha + beta*beta > 9) {
              let tau = 3 / Math.sqrt(alpha*alpha + beta*beta);
              m[i] = tau * alpha * deltas[i];
              m[i+1] = tau * beta * deltas[i];
          }
      }
  }

  // Generate strict control points
  let segments = [];
  for(let i=0; i<cfPoints.length-1; i++) {
      let p0 = cfPoints[i], p1 = cfPoints[i+1];
      let dx = p1.x - p0.x;
      let cp1x = p0.x + dx/3, cp1y = p0.y + m[i] * dx/3;
      let cp2x = p1.x - dx/3, cp2y = p1.y - m[i+1] * dx/3;
      segments.push({ p0, p1, cp1x, cp1y, cp2x, cp2y });
  }

  // 4. Draw the Beautiful S-Curve
  ctx.strokeStyle = '#3b82f6'; 
  ctx.lineWidth = 3; 
  ctx.beginPath();
  
  if (cfPoints.length > 0) {
    ctx.moveTo(toCanvasX(cfPoints[0].x), toCanvasY(cfPoints[0].y));
    segments.forEach(seg => {
        ctx.bezierCurveTo(
            toCanvasX(seg.cp1x), toCanvasY(seg.cp1y),
            toCanvasX(seg.cp2x), toCanvasY(seg.cp2y),
            toCanvasX(seg.p1.x), toCanvasY(seg.p1.y)
        );
    });
    ctx.stroke();
  }

  // Draw the data points
  cfPoints.forEach(p => { 
    ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2); ctx.fill(); 
  });

  // 5. Binary Search to find the EXACT intersection on the newly created S-curve
  function getExactCurveIntersection(targetY) {
    if (targetY <= 0) return cfPoints[0].x;
    if (targetY >= n) return cfPoints[cfPoints.length - 1].x;

    for (let i = 0; i < segments.length; i++) {
      let seg = segments[i];
      if (targetY >= seg.p0.y && targetY <= seg.p1.y) {
        if (seg.p1.y === seg.p0.y) return seg.p0.x + (seg.p1.x - seg.p0.x)/2;

        let tMin = 0, tMax = 1, t = 0.5;
        // Bisection search (40 steps guarantees pinpoint mathematical accuracy)
        for (let step = 0; step < 40; step++) {
          let mt = 1-t;
          let yT = mt*mt*mt*seg.p0.y + 3*mt*mt*t*seg.cp1y + 3*mt*t*t*seg.cp2y + t*t*t*seg.p1.y;
          if (yT < targetY) tMin = t; else tMax = t;
          t = (tMin + tMax) / 2;
        }
        let mt = 1-t;
        return mt*mt*mt*seg.p0.x + 3*mt*mt*t*seg.cp1x + 3*mt*t*t*seg.cp2x + t*t*t*seg.p1.x;
      }
    }
    return xMin;
  }

  function drawReadingLine(cfVal, label, color) {
    const y = toCanvasY(cfVal); 
    let valX = getExactCurveIntersection(cfVal);
    const x = toCanvasX(valX); 
    
    ctx.setLineDash([5, 5]); ctx.strokeStyle = color; ctx.lineWidth = 1.5; 
    ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(x, y); ctx.lineTo(x, margin.top + h); ctx.stroke();
    
    ctx.setLineDash([]); ctx.fillStyle = color; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'left'; 
    ctx.fillText(label + ' ≈ ' + valX.toFixed(1), x + 5, y - 5); 
    return valX;
  }

  const q1Val = drawReadingLine(n / 4, 'Q1', '#059669');
  const medianVal = drawReadingLine(n / 2, 'Median', '#dc2626');
  const q3Val = drawReadingLine(3 * n / 4, 'Q3', '#7c3aed');
  
  // Outer Box Borders
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.setLineDash([]); 
  ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + h); ctx.lineTo(700 - margin.right, margin.top + h); ctx.stroke();
  
  // Axes Labels
  ctx.fillStyle = '#1e293b'; ctx.font = '13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Upper Inequality Limits (x < U)', 350, 445);
  ctx.save(); ctx.translate(15, 225); ctx.rotate(-Math.PI / 2); ctx.fillText('Cumulative Frequency (CF)', 0, 0); ctx.restore();

  const iqr = q3Val - q1Val;
  document.getElementById('cfReadings').innerHTML = `<div class="stats-grid" style="margin-top:16px;">
      <div class="stat-result"><span class="label">Q1 (curve)</span><span class="value">${q1Val.toFixed(1)}</span></div>
      <div class="stat-result"><span class="label">Median (curve)</span><span class="value">${medianVal.toFixed(1)}</span></div>
      <div class="stat-result"><span class="label">Q3 (curve)</span><span class="value">${q3Val.toFixed(1)}</span></div>
      <div class="stat-result"><span class="label">IQR (curve)</span><span class="value">${iqr.toFixed(1)}</span></div>
    </div>`;
}

// ===================== BOX AND WHISKER =====================
function drawBoxWhisker() {
  if (!ensureData()) return;
  const sorted = [...currentData].sort((a, b) => a - b), n = sorted.length, min = sorted[0], max = sorted[n - 1], median = calcMedian(sorted), q1 = calcQ1(sorted), q3 = calcQ3(sorted), iqr = q3 - q1;
  const canvas = document.getElementById('boxWhiskerCanvas'), ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 250; ctx.clearRect(0, 0, 700, 250);

  const margin = { top: 40, right: 40, bottom: 60, left: 40 }, w = 700 - margin.left - margin.right, h = 250 - margin.top - margin.bottom, boxTop = margin.top + 20, boxH = 80;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 250); ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(dataTitle + ' — Box-and-Whisker Plot', 350, 25);

  function toX(val) { return margin.left + ((val - min) / (max - min || 1)) * w; }
  const minX = toX(min), maxX = toX(max), q1X = toX(q1), q3X = toX(q3), medX = toX(median), mid = boxTop + boxH / 2;

  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(minX, mid); ctx.lineTo(q1X, mid); ctx.stroke(); ctx.beginPath(); ctx.moveTo(minX, boxTop + 15); ctx.lineTo(minX, boxTop + boxH - 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(q3X, mid); ctx.lineTo(maxX, mid); ctx.stroke(); ctx.beginPath(); ctx.moveTo(maxX, boxTop + 15); ctx.lineTo(maxX, boxTop + boxH - 15); ctx.stroke();

  ctx.fillStyle = '#bfdbfe'; ctx.fillRect(q1X, boxTop, medX - q1X, boxH); ctx.fillStyle = '#93c5fd'; ctx.fillRect(medX, boxTop, q3X - medX, boxH);
  ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.strokeRect(q1X, boxTop, q3X - q1X, boxH);
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(medX, boxTop); ctx.lineTo(medX, boxTop + boxH); ctx.stroke();

  ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'center'; const labelY = boxTop + boxH + 20;
  ctx.fillText(min, minX, labelY); ctx.fillText(q1, q1X, labelY); ctx.fillText(median, medX, labelY + (Math.abs(medX - q1X) < 30 ? 14 : 0)); ctx.fillText(q3, q3X, labelY); ctx.fillText(max, maxX, labelY);
  
  const descY = boxTop + boxH + 38; ctx.fillStyle = '#94a3b8'; ctx.font = '9px Segoe UI';
  ctx.fillText('Min', minX, descY); ctx.fillText('Q1', q1X, descY); ctx.fillText('Med', medX, descY + (Math.abs(medX - q1X) < 30 ? 14 : 0)); ctx.fillText('Q3', q3X, descY); ctx.fillText('Max', maxX, descY);
  
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin.left, labelY + 28); ctx.lineTo(700 - margin.right, labelY + 28); ctx.stroke();

  let statsHtml = `<div class="stats-grid"><div class="stat-result"><span class="label">Min</span><span class="value">${min}</span></div><div class="stat-result"><span class="label">Q1</span><span class="value">${q1}</span></div><div class="stat-result"><span class="label">Median</span><span class="value">${median}</span></div><div class="stat-result"><span class="label">Q3</span><span class="value">${q3}</span></div><div class="stat-result"><span class="label">Max</span><span class="value">${max}</span></div><div class="stat-result"><span class="label">IQR</span><span class="value">${iqr.toFixed(2)}</span></div><div class="stat-result"><span class="label">Range</span><span class="value">${(max - min).toFixed(2)}</span></div></div>`;
  let skew = median - q1 < q3 - median ? 'Positively skewed (median closer to Q1)' : median - q1 > q3 - median ? 'Negatively skewed (median closer to Q3)' : 'Approximately symmetric';
  statsHtml += `<div class="info-box info"><strong>Shape:</strong> ${skew}</div>`; document.getElementById('boxWhiskerStats').innerHTML = statsHtml;
}

// ===================== CENTRAL TENDENCY =====================
function calculateCentralTendency() {
  if (!ensureData()) return;
  const sorted = [...currentData].sort((a, b) => a - b), n = sorted.length, mean = calcMean(currentData), median = calcMedian(currentData), mode = calcMode(currentData), sum = cleanFloat(currentData.reduce((s, v) => s + v, 0));
  let html = `<h3>Central Tendency — ${dataTitle}</h3><div class="stats-grid"><div class="stat-result"><span class="label">Mean</span><span class="value">${mean.toFixed(2)}</span></div><div class="stat-result"><span class="label">Median</span><span class="value">${median}</span></div><div class="stat-result"><span class="label">Mode</span><span class="value" style="font-size:1rem;">${mode.text}</span></div><div class="stat-result"><span class="label">Sum (&Sigma;x)</span><span class="value">${sum}</span></div><div class="stat-result"><span class="label">Count (N)</span><span class="value">${n}</span></div></div>`;
  html += `<h3>Workings</h3><div class="step"><strong>Mean:</strong> &Sigma;x / N = ${sum} / ${n} = <strong>${mean.toFixed(2)}</strong></div><div class="step"><strong>Sorted data:</strong> ${sorted.join(', ')}<br>`;
  html += n % 2 === 1 ? `<strong>Median:</strong> Middle value (position ${Math.ceil(n / 2)}) = <strong>${median}</strong>` : `<strong>Median:</strong> Average of ${n / 2}th and ${n / 2 + 1}th values = (${sorted[n / 2 - 1]} + ${sorted[n / 2]}) / 2 = <strong>${median}</strong>`;
  html += `</div><div class="step"><strong>Mode:</strong> ${mode.text}</div>`;
  document.getElementById('ctResults').innerHTML = html;
}

function calculateGroupedMean() {
  if (!ensureData()) return;
  const classWidth = 10, groups = getGroupedData(classWidth, null); let totalF = 0, totalFX = 0, totalFX2 = 0;
  let html = '<h3>Grouped Mean Calculation</h3><table><tr><th>Class (L &le; x &lt; U)</th><th>Mid-value (x)</th><th>f</th><th>f &times; x</th><th>f &times; x²</th></tr>';
  groups.forEach(g => { totalF += g.freq; const fx = cleanFloat(g.freq * g.midVal), fx2 = cleanFloat(g.freq * g.midVal * g.midVal); totalFX += fx; totalFX2 += fx2; html += `<tr><td>${g.lower} &le; x &lt; ${g.upper}</td><td>${g.midVal}</td><td>${g.freq}</td><td>${fx.toFixed(1)}</td><td>${fx2.toFixed(1)}</td></tr>`; });
  html += `<tr style="font-weight:bold;"><td>Total (&Sigma;)</td><td></td><td>${totalF}</td><td>${totalFX.toFixed(1)}</td><td>${totalFX2.toFixed(1)}</td></tr></table>`;
  const groupedMean = totalFX / totalF; html += `<div class="info-box formula">Estimated Mean = &Sigma;fx / &Sigma;f = ${totalFX.toFixed(1)} / ${totalF} = <strong>${groupedMean.toFixed(2)}</strong></div>`;
  document.getElementById('groupedMeanResult').innerHTML = html;
}

// ===================== SPREAD =====================
function calculateSpread() {
  if (!ensureData()) return;
  const sorted = [...currentData].sort((a, b) => a - b), n = sorted.length, min = sorted[0], max = sorted[n - 1], range = max - min, q1 = calcQ1(currentData), q3 = calcQ3(currentData), iqr = q3 - q1, variance = calcVariance(currentData), sd = calcSD(currentData);
  let html = `<h3>Measures of Spread — ${dataTitle}</h3><div class="stats-grid"><div class="stat-result"><span class="label">Min</span><span class="value">${min}</span></div><div class="stat-result"><span class="label">Max</span><span class="value">${max}</span></div><div class="stat-result"><span class="label">Range</span><span class="value">${cleanFloat(range)}</span></div><div class="stat-result"><span class="label">Q1</span><span class="value">${q1}</span></div><div class="stat-result"><span class="label">Q3</span><span class="value">${q3}</span></div><div class="stat-result"><span class="label">IQR</span><span class="value">${cleanFloat(iqr)}</span></div><div class="stat-result"><span class="label">Variance</span><span class="value">${variance.toFixed(2)}</span></div><div class="stat-result"><span class="label">Std Dev (&sigma;)</span><span class="value">${sd.toFixed(2)}</span></div></div>`;
  html += `<h3>Finding Quartiles</h3><div class="step">Sorted data: ${sorted.join(', ')}<br>n = ${n}</div>`;
  const lowerHalf = sorted.slice(0, Math.floor(n / 2)), upperHalf = sorted.slice(n % 2 === 1 ? Math.floor(n / 2) + 1 : Math.floor(n / 2));
  html += `<div class="step">Lower half: ${lowerHalf.join(', ')}<br>Q1 = median of lower half = <strong>${q1}</strong></div><div class="step">Upper half: ${upperHalf.join(', ')}<br>Q3 = median of upper half = <strong>${q3}</strong></div><div class="step">IQR = Q3 − Q1 = ${q3} − ${q1} = <strong>${cleanFloat(iqr)}</strong></div>`;
  document.getElementById('spreadResults').innerHTML = html;
}

// ===================== STANDARD DEVIATION =====================
function calculateSD() {
  if (!ensureData()) return;
  const mean = calcMean(currentData), sd = calcSD(currentData), variance = calcVariance(currentData), n = currentData.length, sumSq = currentData.reduce((s, v) => s + v * v, 0);
  let html = `<h3>Standard Deviation — ${dataTitle}</h3><div class="stats-grid"><div class="stat-result"><span class="label">Mean (x̄)</span><span class="value">${mean.toFixed(4)}</span></div><div class="stat-result"><span class="label">Variance (&sigma;²)</span><span class="value">${variance.toFixed(4)}</span></div><div class="stat-result"><span class="label">Std Dev (&sigma;)</span><span class="value">${sd.toFixed(4)}</span></div></div>`;
  html += `<div class="info-box formula">Using population formula:<br>SD = &radic;[ (&Sigma;x²/n) &minus; (x̄)² ]<br>= &radic;[ (${sumSq.toFixed(2)}/${n}) &minus; (${mean.toFixed(4)})² ]<br>= &radic;[ ${(sumSq/n).toFixed(4)} &minus; ${(mean*mean).toFixed(4)} ]<br>= &radic;[ ${variance.toFixed(4)} ]<br>= <strong>${sd.toFixed(4)}</strong></div>`;
  document.getElementById('sdResults').innerHTML = html;
}

function showSDWorkings() {
  if (!ensureData()) return;
  const mean = calcMean(currentData), n = currentData.length; let sumSqDev = 0, html = '<h3>Full SD Workings (Step-by-Step)</h3><table><tr><th>x</th><th>x &minus; x̄</th><th>(x &minus; x̄)²</th></tr>';
  currentData.forEach(v => { const dev = v - mean, sqDev = dev * dev; sumSqDev += sqDev; html += `<tr><td>${v}</td><td>${dev.toFixed(4)}</td><td>${sqDev.toFixed(4)}</td></tr>`; });
  html += `<tr style="font-weight:bold;"><td>&Sigma;x = ${cleanFloat(currentData.reduce((s,v)=>s+v,0))}</td><td></td><td>&Sigma;(x &minus; x̄)² = ${sumSqDev.toFixed(4)}</td></tr></table>`;
  const variance = sumSqDev / n, sd = Math.sqrt(variance);
  html += `<div class="step">Mean x̄ = ${mean.toFixed(4)}</div><div class="step">&Sigma;(x &minus; x̄)² = ${sumSqDev.toFixed(4)}</div><div class="step">Variance = &Sigma;(x &minus; x̄)² / N = ${sumSqDev.toFixed(4)} / ${n} = ${variance.toFixed(4)}</div><div class="step">SD = &radic;(Variance) = &radic;(${variance.toFixed(4)}) = <strong>${sd.toFixed(4)}</strong></div>`;
  document.getElementById('sdWorkings').innerHTML = html;
}

function calculateGroupedSD() {
  if (!ensureData()) return;
  const classWidth = 10, groups = getGroupedData(classWidth, null); let totalF = 0, totalFX = 0, totalFX2 = 0;
  groups.forEach(g => { totalF += g.freq; totalFX += g.freq * g.midVal; totalFX2 += g.freq * g.midVal * g.midVal; });
  const groupedMean = totalFX / totalF, groupedVar = (totalFX2 / totalF) - (groupedMean * groupedMean), groupedSD = Math.sqrt(groupedVar);
  let html = '<h3>Grouped Standard Deviation</h3><table><tr><th>Class (L &le; x &lt; U)</th><th>x (mid)</th><th>f</th><th>fx</th><th>fx²</th></tr>';
  groups.forEach(g => { const fx = cleanFloat(g.freq * g.midVal), fx2 = cleanFloat(g.freq * g.midVal * g.midVal); html += `<tr><td>${g.lower} &le; x &lt; ${g.upper}</td><td>${g.midVal}</td><td>${g.freq}</td><td>${fx.toFixed(1)}</td><td>${fx2.toFixed(1)}</td></tr>`; });
  html += `<tr style="font-weight:bold;"><td>Total (&Sigma;)</td><td></td><td>${totalF}</td><td>${totalFX.toFixed(1)}</td><td>${totalFX2.toFixed(1)}</td></tr></table>`;
  html += `<div class="info-box formula">Mean = &Sigma;fx / &Sigma;f = ${totalFX.toFixed(1)} / ${totalF} = ${groupedMean.toFixed(4)}<br><br>SD = &radic;[ (&Sigma;fx²/&Sigma;f) &minus; (Mean)² ]<br>= &radic;[ (${totalFX2.toFixed(1)}/${totalF}) &minus; (${groupedMean.toFixed(4)})² ]<br>= &radic;[ ${(totalFX2/totalF).toFixed(4)} &minus; ${(groupedMean*groupedMean).toFixed(4)} ]<br>= &radic;[ ${groupedVar.toFixed(4)} ]<br>= <strong>${groupedSD.toFixed(4)}</strong></div>`;
  document.getElementById('groupedSDResult').innerHTML = html;
}

// ===================== COMPARING DATA SETS =====================
function compareDataSets() {
  const dataA = parseData(document.getElementById('compDataA').value), dataB = parseData(document.getElementById('compDataB').value), labelA = document.getElementById('compLabelA').value || 'Set A', labelB = document.getElementById('compLabelB').value || 'Set B';
  if (dataA.length === 0 || dataB.length === 0) { alert('Please enter data for both sets.'); return; }

  const statsA = { mean: calcMean(dataA), median: calcMedian(dataA), sd: calcSD(dataA), q1: calcQ1(dataA), q3: calcQ3(dataA), min: Math.min(...dataA), max: Math.max(...dataA), range: Math.max(...dataA) - Math.min(...dataA), iqr: calcQ3(dataA) - calcQ1(dataA), n: dataA.length };
  const statsB = { mean: calcMean(dataB), median: calcMedian(dataB), sd: calcSD(dataB), q1: calcQ1(dataB), q3: calcQ3(dataB), min: Math.min(...dataB), max: Math.max(...dataB), range: Math.max(...dataB) - Math.min(...dataB), iqr: calcQ3(dataB) - calcQ1(dataB), n: dataB.length };

  let html = `<h3>Comparison Results</h3><table><tr><th>Measure</th><th>${labelA}</th><th>${labelB}</th><th>Comparison</th></tr>`;
  const rows = [['N (Count)', statsA.n, statsB.n], ['Mean', statsA.mean.toFixed(2), statsB.mean.toFixed(2)], ['Median', statsA.median, statsB.median], ['Std Dev', statsA.sd.toFixed(2), statsB.sd.toFixed(2)], ['Range', cleanFloat(statsA.range), cleanFloat(statsB.range)], ['IQR', cleanFloat(statsA.iqr), cleanFloat(statsB.iqr)], ['Min', statsA.min, statsB.min], ['Max', statsA.max, statsB.max]];
  rows.forEach(r => { let comp = ''; const a = parseFloat(r[1]), b = parseFloat(r[2]); if (a > b) comp = labelA + ' higher'; else if (b > a) comp = labelB + ' higher'; else comp = 'Equal'; html += `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${comp}</td></tr>`; });
  html += '</table>';

  const meanDiff = statsA.mean > statsB.mean, sdDiff = statsA.sd > statsB.sd;
  html += `<h3>📝 Model Comparison Statement</h3><div class="info-box tip">"${labelA} has a ${meanDiff ? 'higher' : 'lower'} mean (${statsA.mean.toFixed(2)}) compared to ${labelB} (${statsB.mean.toFixed(2)}). This suggests that, on average, ${meanDiff ? labelA : labelB} has ${meanDiff ? 'higher' : 'lower'} values."<br><br>"${labelA} has a ${sdDiff ? 'larger' : 'smaller'} standard deviation (${statsA.sd.toFixed(2)}) compared to ${labelB} (${statsB.sd.toFixed(2)}). This means ${sdDiff ? labelB : labelA}'s data is more consistent/less varied, while ${sdDiff ? labelA : labelB}'s data is more spread out."</div>`;
  document.getElementById('comparisonResults').innerHTML = html;

  const canvas = document.getElementById('comparisonCanvas'); canvas.style.display = 'block'; const ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 280; ctx.clearRect(0, 0, 700, 280);
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 280); ctx.fillStyle = '#1e293b'; ctx.font = 'bold 14px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Box-and-Whisker Comparison', 350, 20);

  const allMin = Math.min(statsA.min, statsB.min), allMax = Math.max(statsA.max, statsB.max), margin = { left: 80, right: 40 }, plotW = 700 - margin.left - margin.right;
  function toX(val) { return margin.left + ((val - allMin) / (allMax - allMin || 1)) * plotW; }

  function drawBox(stats, y, boxH, color, label) {
    const minX = toX(stats.min), q1X = toX(stats.q1), medX = toX(stats.median), q3X = toX(stats.q3), maxX = toX(stats.max), mid = y + boxH / 2;
    ctx.fillStyle = '#1e293b'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'right'; ctx.fillText(label, margin.left - 10, mid + 4);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(minX, mid); ctx.lineTo(q1X, mid); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q3X, mid); ctx.lineTo(maxX, mid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(minX, y + 10); ctx.lineTo(minX, y + boxH - 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(maxX, y + 10); ctx.lineTo(maxX, y + boxH - 10); ctx.stroke();
    ctx.fillStyle = color + '88'; ctx.fillRect(q1X, y, q3X - q1X, boxH); ctx.strokeStyle = color; ctx.strokeRect(q1X, y, q3X - q1X, boxH);
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(medX, y); ctx.lineTo(medX, y + boxH); ctx.stroke();
  }

  drawBox(statsA, 40, 60, '#3b82f6', labelA); drawBox(statsB, 130, 60, '#10b981', labelB);
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin.left, 220); ctx.lineTo(700 - margin.right, 220); ctx.stroke();
  const step = Math.ceil((allMax - allMin) / 10);
  for (let v = Math.floor(allMin); v <= Math.ceil(allMax); v += step || 1) {
    const x = toX(v); ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(x, 218); ctx.lineTo(x, 225); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(v, x, 240);
  }
}

// ===================== MISLEADING GRAPHS =====================
function drawMisleadingGraph(misleading) {
  const canvas = document.getElementById('misleadingCanvas'), ctx = canvas.getContext('2d'); canvas.width = 700; canvas.height = 350; ctx.clearRect(0, 0, 700, 350);
  const data = [{ label: 'Brand A', value: 85 }, { label: 'Brand B', value: 82 }, { label: 'Brand C', value: 80 }, { label: 'Brand D', value: 78 }];
  const margin = { top: 40, right: 30, bottom: 60, left: 60 }, w = 700 - margin.left - margin.right, h = 350 - margin.top - margin.bottom, barW = w / (data.length * 2), yMin = misleading ? 75 : 0, yMax = 90;

  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 700, 350);
  ctx.fillStyle = misleading ? '#dc2626' : '#059669'; ctx.font = 'bold 16px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(misleading ? '⚠️ MISLEADING Graph (y-axis starts at 75)' : '✅ FAIR Graph (y-axis starts at 0)', 350, 25);

  const ySteps = misleading ? 5 : 9;
  for (let i = 0; i <= ySteps; i++) {
    const val = yMin + (i / ySteps) * (yMax - yMin), y = margin.top + h - (i / ySteps) * h;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(700 - margin.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'right'; ctx.fillText(Math.round(val), margin.left - 8, y + 4);
  }

  if (misleading) {
    const by = margin.top + h; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(margin.left - 5, by - 5); ctx.lineTo(margin.left + 5, by - 15); ctx.moveTo(margin.left - 5, by - 10); ctx.lineTo(margin.left + 5, by - 20); ctx.stroke();
  }

  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];
  data.forEach((d, i) => {
    const x = margin.left + i * (w / data.length) + barW / 2, barH = ((d.value - yMin) / (yMax - yMin)) * h, y = margin.top + h - barH;
    ctx.fillStyle = colors[i]; ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(d.value, x + barW / 2, y - 8);
    ctx.fillStyle = '#64748b'; ctx.font = '12px Segoe UI'; ctx.fillText(d.label, x + barW / 2, margin.top + h + 20);
  });

  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + h); ctx.lineTo(700 - margin.right, margin.top + h); ctx.stroke();

  const explDiv = document.getElementById('misleadingExplanation');
  if (misleading) {
    explDiv.innerHTML = `<div class="info-box warning"><strong>⚠️ Why is this misleading?</strong><br>The y-axis starts at 75 instead of 0. This makes the differences between brands appear much larger than they actually are. Brand A appears to be about 3&times; taller than Brand D, but the actual difference is only ${data[0].value - data[3].value} out of ${data[0].value} (about ${((data[0].value - data[3].value)/data[0].value * 100).toFixed(1)}%).</div>`;
  } else {
    explDiv.innerHTML = `<div class="info-box tip"><strong>✅ This is a fair representation.</strong><br>The y-axis starts at 0, giving an accurate visual impression of the differences between brands. You can see that all brands are quite similar (range of only ${data[0].value - data[3].value}).</div>`;
  }
}

// ===================== INFERENCE PRACTICE =====================
function generateInferencePractice() {
  const scenarios = [
    { title: 'Exam Score Distribution', data: [35, 42, 48, 55, 58, 62, 65, 65, 68, 70, 72, 72, 75, 78, 80, 82, 85, 88, 92, 95], questions: ['What is the shape of the distribution?', 'Where is most of the data concentrated?', 'Are there any outliers?', 'What fraction of students scored above 70?'] },
    { title: 'Daily Rainfall (mm)', data: [0, 0, 0, 2, 0, 5, 12, 0, 3, 0, 0, 8, 25, 0, 1, 0, 0, 4, 0, 15], questions: ['What is the mode and what does it tell us?', 'Is the mean a good measure of central tendency here? Why or why not?', 'What does the data tell us about rainfall patterns?'] }
  ];
  const s = scenarios[Math.floor(Math.random() * scenarios.length)], sorted = [...s.data].sort((a, b) => a - b), mean = calcMean(s.data), median = calcMedian(s.data), mode = calcMode(s.data);
  let html = `<div class="card" style="margin-top:16px;"><h3>📊 ${s.title}</h3><p><strong>Data:</strong> ${sorted.join(', ')}</p><div class="stats-grid"><div class="stat-result"><span class="label">Mean</span><span class="value">${mean.toFixed(1)}</span></div><div class="stat-result"><span class="label">Median</span><span class="value">${median}</span></div><div class="stat-result"><span class="label">Mode</span><span class="value">${mode.text}</span></div></div><h4>Questions to Consider:</h4>`;
  s.questions.forEach((q, i) => { html += `<div class="quiz-question"><p><strong>${i + 1}.</strong> ${q}</p><div class="working-area"><textarea placeholder="Write your answer here..."></textarea></div></div>`; });
  html += '</div>'; document.getElementById('inferencePractice').innerHTML = html;
}

// ===================== PRACTICE MCQ ENGINE (JSON FETCH) =====================
let currentMcqData = []; 

const defaultMcqBank = [
  { q: 'Which measure of central tendency is most affected by outliers?', options: ['Mean', 'Median', 'Mode', 'Range'], correct: 0, explanation: 'The mean uses every value in its calculation, so extreme values (outliers) pull it towards them.' },
  { q: 'In a histogram, the bars have no gaps because:', options: ['It looks better', 'The data is continuous', 'The data is categorical', 'The frequencies are equal'], correct: 1, explanation: 'Histograms represent continuous data where class intervals are adjacent with no gaps between them.' },
  { q: 'What does the Interquartile Range (IQR) represent?', options: ['The range of all data', 'The spread of the middle 50% of data', 'The difference between mean and median', 'The standard deviation'], correct: 1, explanation: 'IQR = Q3 &minus; Q1, which represents the range of the middle 50% of the data.' },
  { q: 'The cumulative frequency curve is also known as:', options: ['Histogram', 'Ogive', 'Stem-and-leaf', 'Box plot'], correct: 1, explanation: 'A cumulative frequency curve is also called an ogive.' },
  { q: 'Which diagram retains all the original data values?', options: ['Histogram', 'Pie chart', 'Stem-and-leaf diagram', 'Box-and-whisker plot'], correct: 2, explanation: 'A stem-and-leaf diagram shows every individual data value (stem + leaf = original value).' },
  { q: 'A small standard deviation indicates that:', options: ['The data values are far from the mean', 'The data values are clustered near the mean', 'The mean is small', 'There are few data values'], correct: 1, explanation: 'A small standard deviation means the data points are close to the mean &mdash; the data is consistent.' }
];

function loadMCQBank(path, buttonElement = null) {
  if (buttonElement) {
    document.querySelectorAll('#bankButtons .btn').forEach(btn => btn.classList.remove('active-bank'));
    buttonElement.classList.add('active-bank');
  }

  const questionContainer = document.getElementById('mcqQuestions');
  document.getElementById('mcqScore').innerHTML = '';

  if (path === 'default') {
    currentMcqData = [...defaultMcqBank];
    renderMCQs(currentMcqData);
  } else {
    questionContainer.innerHTML = '<p><em>Loading questions...</em></p>';
    fetch(path)
      .then(response => {
        if (!response.ok) throw new Error('File not found');
        return response.json();
      })
      .then(data => {
        currentMcqData = data;
        renderMCQs(currentMcqData);
      })
      .catch(error => {
        console.error('Error loading JSON:', error);
        questionContainer.innerHTML = `<div class="info-box warning"><strong>⚠️ Network Error:</strong> Could not load questions. Check your URL.</div>`;
      });
  }
}

function refreshCurrentBank() {
  if(currentMcqData.length > 0) renderMCQs(currentMcqData);
}

function renderMCQs(bank) {
  const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, 8);
  let html = '';
  shuffled.forEach((q, i) => {
    const questionText = q.question || q.q;
    const correctIdx = q.correct_index !== undefined ? q.correct_index : q.correct;

    html += `<div class="quiz-question" id="mcq-${i}" data-correct="${correctIdx}"><h4>Question ${i + 1}: ${questionText}</h4>`;
    q.options.forEach((opt, j) => { html += `<label class="quiz-option" onclick="selectMCQ(${i}, ${j}, this)"><strong>${String.fromCharCode(65 + j)}.</strong> ${opt}</label>`; });
    html += `<div class="quiz-feedback" id="mcq-fb-${i}"></div><p style="display:none;" id="mcq-exp-${i}">${q.explanation}</p></div>`;
  });
  document.getElementById('mcqQuestions').innerHTML = html; 
  document.getElementById('mcqScore').innerHTML = '';
}

function selectMCQ(qIdx, optIdx, el) {
  const q = document.getElementById('mcq-' + qIdx);
  q.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected'); q.setAttribute('data-selected', optIdx);
}

function checkAllMCQ() {
  const questions = document.querySelectorAll('[id^="mcq-"]');
  let correct = 0, total = 0;
  questions.forEach(q => {
    if (!q.id.startsWith('mcq-') || q.id.includes('fb') || q.id.includes('exp')) return;
    const idx = parseInt(q.id.split('-')[1]), correctAns = parseInt(q.getAttribute('data-correct')), selected = q.getAttribute('data-selected'), fb = document.getElementById('mcq-fb-' + idx), exp = document.getElementById('mcq-exp-' + idx)?.textContent;
    if (selected === null || selected === 'undefined') { fb.className = 'quiz-feedback show wrong'; fb.textContent = 'Not answered. ' + exp; total++; return; }
    total++; const selIdx = parseInt(selected), options = q.querySelectorAll('.quiz-option');
    if (selIdx === correctAns) { correct++; options[selIdx].classList.add('correct'); fb.className = 'quiz-feedback show correct'; fb.textContent = '✓ Correct! ' + exp; }
    else { options[selIdx].classList.add('wrong'); options[correctAns].classList.add('correct'); fb.className = 'quiz-feedback show wrong'; fb.textContent = '✗ Incorrect. ' + exp; }
  });

  if (total > 0) {
    const pct = Math.round((correct / total) * 100);
    document.getElementById('mcqScore').innerHTML = `<div class="info-box ${pct >= 70 ? 'tip' : 'warning'}" style="margin-top:16px;"><strong>Score: ${correct} / ${total} (${pct}%)</strong><div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>${pct >= 90 ? '🌟 Excellent! You have a strong understanding!' : pct >= 70 ? '👍 Good job! Review the ones you missed.' : pct >= 50 ? '📚 Keep practicing! Review the explanations.' : '💪 More study needed. Re-read the topic sections.'}</div>`;
  }
}

// ===================== CALCULATION PRACTICE =====================
function generateCalcPractice() {
  const n = Math.floor(Math.random() * 5) + 8; const data = [];
  for (let i = 0; i < n; i++) data.push(Math.floor(Math.random() * 50) + 30);
  const sorted = [...data].sort((a, b) => a - b), mean = calcMean(data), median = calcMedian(data), q1 = calcQ1(data), q3 = calcQ3(data), sd = calcSD(data);

  let html = `<div class="card" style="margin-top:16px;"><h3>📐 Calculation Practice</h3><p><strong>Data:</strong> ${data.join(', ')}</p><p>Calculate the following. Show your working in the spaces provided.</p>
    <div class="quiz-question"><h4>1. Find the Mean</h4><div class="working-area"><textarea placeholder="Show your working..."></textarea></div><button class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.style.display='block'">Show Answer</button><div style="display:none;" class="info-box tip">Mean = ${data.reduce((s,v)=>s+v,0)} &divide; ${n} = <strong>${mean.toFixed(2)}</strong></div></div>
    <div class="quiz-question"><h4>2. Find the Median</h4><div class="working-area"><textarea placeholder="Arrange in order first..."></textarea></div><button class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.style.display='block'">Show Answer</button><div style="display:none;" class="info-box tip">Sorted: ${sorted.join(', ')}<br>Median = <strong>${median}</strong></div></div>
    <div class="quiz-question"><h4>3. Find Q1, Q3, and IQR</h4><div class="working-area"><textarea placeholder="Find the quartiles..."></textarea></div><button class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.style.display='block'">Show Answer</button><div style="display:none;" class="info-box tip">Q1 = <strong>${q1}</strong>, Q3 = <strong>${q3}</strong>, IQR = Q3 &minus; Q1 = <strong>${q3 - q1}</strong></div></div>
    <div class="quiz-question"><h4>4. Calculate the Standard Deviation</h4><div class="working-area"><textarea placeholder="Use the formula SD = &radic;[&Sigma;(x-x̄)²/n] ..."></textarea></div><button class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.style.display='block'">Show Answer</button><div style="display:none;" class="info-box tip">SD = <strong>${sd.toFixed(4)}</strong><br>Using: &radic;[(&Sigma;x²/N) &minus; x̄²] = &radic;[(${data.reduce((s,v)=>s+v*v,0)}/${n}) &minus; ${mean.toFixed(4)}²] = &radic;[${(data.reduce((s,v)=>s+v*v,0)/n).toFixed(4)} &minus; ${(mean*mean).toFixed(4)}]</div></div></div>`;
  document.getElementById('calcPractice').innerHTML = html;
}

// ===================== INTERPRETATION PRACTICE =====================
function generateInterpPractice() {
  const scenarios = [
    { title: 'Two students took 10 tests each.', dataA: [72, 75, 68, 80, 71, 73, 69, 76, 74, 72], dataB: [90, 45, 82, 55, 95, 40, 88, 50, 85, 60], labelA: 'Student A', labelB: 'Student B', questions: ['Calculate the mean and standard deviation for each student.', 'Which student performed better on average?', 'Which student was more consistent? Explain using standard deviation.', 'If you were a teacher, what advice would you give each student?'] },
    { title: 'Monthly sales of two shops', dataA: [120, 130, 125, 128, 132, 127], dataB: [80, 150, 90, 180, 100, 170], labelA: 'Shop A', labelB: 'Shop B', questions: ['Calculate the mean sales for each shop.', 'Calculate the standard deviation for each shop.', 'Which shop has more consistent sales?', 'Which shop would a bank consider more reliable for a loan? Explain.'] }
  ];
  const s = scenarios[Math.floor(Math.random() * scenarios.length)], statsA = { mean: calcMean(s.dataA), sd: calcSD(s.dataA) }, statsB = { mean: calcMean(s.dataB), sd: calcSD(s.dataB) };

  let html = `<div class="card" style="margin-top:16px;"><h3>📊 ${s.title}</h3><p><strong>${s.labelA}:</strong> ${s.dataA.join(', ')}</p><p><strong>${s.labelB}:</strong> ${s.dataB.join(', ')}</p>`;
  s.questions.forEach((q, i) => { html += `<div class="quiz-question"><h4>${i + 1}. ${q}</h4><div class="working-area"><textarea placeholder="Write your answer..."></textarea></div></div>`; });
  html += `<button class="btn btn-success" onclick="this.nextElementSibling.style.display='block'">Show Model Answers</button><div style="display:none;" class="info-box tip"><strong>${s.labelA}:</strong> Mean = ${statsA.mean.toFixed(2)}, SD = ${statsA.sd.toFixed(2)}<br><strong>${s.labelB}:</strong> Mean = ${statsB.mean.toFixed(2)}, SD = ${statsB.sd.toFixed(2)}<br><br>${statsA.mean > statsB.mean ? s.labelA : s.labelB} has a higher mean (performed better on average).<br>${statsA.sd < statsB.sd ? s.labelA : s.labelB} has a smaller SD (more consistent/reliable).</div></div>`;
  document.getElementById('interpPractice').innerHTML = html;
}

// ===================== FULL CALCULATOR =====================
function fullCalculation() {
  const input = document.getElementById('calcInput').value;
  const data = parseData(input);
  if (data.length === 0) { alert('Please enter valid data.'); return; }

  const sorted = [...data].sort((a, b) => a - b), n = data.length, sum = cleanFloat(data.reduce((s, v) => s + v, 0)), sumSq = cleanFloat(data.reduce((s, v) => s + v * v, 0));
  const mean = calcMean(data), median = calcMedian(data), mode = calcMode(data), q1 = calcQ1(data), q3 = calcQ3(data), iqr = q3 - q1, min = sorted[0], max = sorted[n - 1], range = max - min, variance = calcVariance(data), sd = calcSD(data);

  let html = `<h3>📊 Complete Statistical Analysis</h3><div class="info-box info"><strong>Data (sorted):</strong> ${sorted.join(', ')}<br><strong>N = ${n}</strong></div>`;
  html += `<h3>🎯 Central Tendency</h3><div class="stats-grid"><div class="stat-result"><span class="label">Mean</span><span class="value">${mean.toFixed(4)}</span></div><div class="stat-result"><span class="label">Median</span><span class="value">${median}</span></div><div class="stat-result"><span class="label">Mode</span><span class="value" style="font-size:0.9rem;">${mode.text}</span></div></div>`;
  html += `<h3>↔️ Measures of Spread</h3><div class="stats-grid"><div class="stat-result"><span class="label">Range</span><span class="value">${cleanFloat(range)}</span></div><div class="stat-result"><span class="label">Q1</span><span class="value">${q1}</span></div><div class="stat-result"><span class="label">Q3</span><span class="value">${q3}</span></div><div class="stat-result"><span class="label">IQR</span><span class="value">${cleanFloat(iqr)}</span></div><div class="stat-result"><span class="label">Variance</span><span class="value">${variance.toFixed(4)}</span></div><div class="stat-result"><span class="label">Std Dev</span><span class="value">${sd.toFixed(4)}</span></div><div class="stat-result"><span class="label">Min</span><span class="value">${min}</span></div><div class="stat-result"><span class="label">Max</span><span class="value">${max}</span></div><div class="stat-result"><span class="label">Sum (&Sigma;x)</span><span class="value">${sum}</span></div><div class="stat-result"><span class="label">&Sigma;x²</span><span class="value">${sumSq}</span></div></div>`;
  html += `<h3>📦 Five-Number Summary</h3><div class="info-box formula">Min = ${min} | Q1 = ${q1} | Median = ${median} | Q3 = ${q3} | Max = ${max}</div>`;

  const freq = {}; sorted.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const keys = Object.keys(freq).map(Number).sort((a, b) => a - b);
  html += `<h3>📑 Frequency Table</h3><table><tr><th>Value</th><th>Frequency</th></tr>`;
  keys.forEach(k => { html += `<tr><td>${k}</td><td>${freq[k]}</td></tr>`; });
  html += `</table><h3>🌿 Stem-and-Leaf Diagram</h3>`;

  const stems = {};
  sorted.forEach(v => { const stem = Math.floor(v / 10), leaf = Math.round(v % 10); if (!stems[stem]) stems[stem] = []; stems[stem].push(leaf); });
  const stemKeys = Object.keys(stems).map(Number).sort((a, b) => a - b);
  html += `<div class="stem-leaf-display"><div style="font-weight:700; margin-bottom:4px;">Stem | Leaf</div>`;
  for (let s = stemKeys[0]; s <= stemKeys[stemKeys.length - 1]; s++) { const leaves = (stems[s] || []).sort((a, b) => a - b); html += `<div class="stem-leaf-row"><span class="stem-val">${s}</span><span class="leaf-vals">${leaves.join(' ')}</span></div>`; }
  html += `</div><small>Key: ${stemKeys[0]} | ${(stems[stemKeys[0]] || [0])[0]} means ${stemKeys[0]}${(stems[stemKeys[0]] || [0])[0]}</small>`;

  html += `<h3>📐 Standard Deviation Working</h3><div class="info-box formula">x̄ = ${sum}/${n} = ${mean.toFixed(4)}<br>SD = &radic;[(&Sigma;x²/n) &minus; x̄²]<br>= &radic;[(${sumSq}/${n}) &minus; (${mean.toFixed(4)})²]<br>= &radic;[${(sumSq/n).toFixed(4)} &minus; ${(mean*mean).toFixed(4)}]<br>= &radic;[${variance.toFixed(4)}]<br>= <strong>${sd.toFixed(4)}</strong></div>`;

  document.getElementById('fullCalcResults').innerHTML = html;
  currentData = data;
}

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', function() {
  processData();
  loadMCQBank('default'); // Load the default built-in bank initially
});