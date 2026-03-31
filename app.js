/* ═══════════════════════════════════════════════════════════
   OPUSBENCH — app.js
   Three.js scene · Chart.js graphs · Interactivity · Demo
═══════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────
   1. THREE.JS  ——  Neural-network background scene
   ────────────────────────────────────────────────────────── */
(function initThree() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  /* ── Nodes ─────────────────────────────────────────────── */
  const NODE_COUNT = 80;
  const nodeGeo  = new THREE.SphereGeometry(0.5, 8, 8);
  const nodeMat  = new THREE.MeshBasicMaterial({ color: 0x7c5cfc });
  const nodes    = [];
  const positions = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
    mesh.position.set(
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 80
    );
    mesh.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.03
    );
    mesh.userData.pulse = Math.random() * Math.PI * 2;
    scene.add(mesh);
    nodes.push(mesh);
    positions.push(mesh.position.clone());
  }

  /* ── Edges (line segments) ──────────────────────────────── */
  const MAX_DIST = 30;
  const edgeGeo  = new THREE.BufferGeometry();
  const edgeVerts = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (nodes[i].position.distanceTo(nodes[j].position) < MAX_DIST) {
        edgeVerts.push(...nodes[i].position.toArray(), ...nodes[j].position.toArray());
      }
    }
  }

  const posAttr = new THREE.Float32BufferAttribute(edgeVerts, 3);
  edgeGeo.setAttribute('position', posAttr);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x3a2899, transparent: true, opacity: 0.3 });
  const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
  scene.add(edgeLines);

  /* ── Particles (background dust) ──────────────────────── */
  const ptGeo = new THREE.BufferGeometry();
  const ptPos = new Float32Array(300 * 3);
  for (let i = 0; i < 300 * 3; i++) ptPos[i] = (Math.random() - 0.5) * 200;
  ptGeo.setAttribute('position', new THREE.Float32BufferAttribute(ptPos, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x4a3080, size: 0.4, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  /* ── Mouse parallax ────────────────────────────────────── */
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Resize ─────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  /* ── Animate ────────────────────────────────────────────── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    /* drift nodes */
    nodes.forEach((n) => {
      n.position.add(n.userData.vel);
      ['x','y','z'].forEach((ax) => {
        if (Math.abs(n.position[ax]) > 80) n.userData.vel[ax] *= -1;
      });
      n.userData.pulse += 0.04;
      const s = 0.8 + 0.4 * Math.sin(n.userData.pulse);
      n.scale.setScalar(s);
      const c = Math.floor(0x3a2899 + Math.sin(n.userData.pulse) * 0x3a2060);
      n.material.color.setHex(c < 0 ? 0x3a2899 : c);
    });

    /* rebuild edge vertices */
    const ev = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d < MAX_DIST) ev.push(...nodes[i].position.toArray(), ...nodes[j].position.toArray());
      }
    }
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ev, 3));
    edgeGeo.attributes.position.needsUpdate = true;

    /* camera sway */
    camera.position.x += (mx * 12 - camera.position.x) * 0.02;
    camera.position.y += (-my * 8  - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();
})();


/* ──────────────────────────────────────────────────────────
   2. MODEL DATA
   ────────────────────────────────────────────────────────── */
const MODELS = {
  opus4: {
    name: 'Claude Opus 4',
    maker: 'Anthropic',
    icon: '🧠',
    color: '#a78bfa',
    humanEval: 92.0,
    mmlu: 90.1,
    gsm8k: 97.0,
    hePlus: 89.0,
    swe: 18.0,
    context: '200K',
    contextK: 200,
    year: '2025',
    type: 'General + Code',
    score: 97,
  },
  opus3: {
    name: 'Claude 3 Opus',
    maker: 'Anthropic',
    icon: '🧠',
    color: '#7c5cfc',
    humanEval: 84.9,
    mmlu: 86.8,
    gsm8k: 95.0,
    hePlus: 82.1,
    swe: 11.5,
    context: '200K',
    contextK: 200,
    year: '2024',
    type: 'General + Code',
    score: 94,
  },
  sonnet: {
    name: 'Claude 3.5 Sonnet',
    maker: 'Anthropic',
    icon: '🎵',
    color: '#60a5fa',
    humanEval: 92.0,
    mmlu: 88.7,
    gsm8k: 96.4,
    hePlus: 86.0,
    swe: 49.0,
    context: '200K',
    contextK: 200,
    year: '2024',
    type: 'General + Code',
    score: 91,
  },
  haiku: {
    name: 'Claude 3 Haiku',
    maker: 'Anthropic',
    icon: '🌸',
    color: '#34d399',
    humanEval: 75.9,
    mmlu: 75.2,
    gsm8k: 88.9,
    hePlus: 73.4,
    swe: 3.0,
    context: '200K',
    contextK: 200,
    year: '2024',
    type: 'Fast / Edge',
    score: 78,
  },
  gpt4o: {
    name: 'GPT-4o',
    maker: 'OpenAI',
    icon: '⚡',
    color: '#fb923c',
    humanEval: 90.2,
    mmlu: 88.7,
    gsm8k: 97.1,
    hePlus: 85.5,
    swe: 22.0,
    context: '128K',
    contextK: 128,
    year: '2024',
    type: 'General + Vision',
    score: 90,
  },
  o3: {
    name: 'OpenAI o3',
    maker: 'OpenAI',
    icon: '🔮',
    color: '#f472b6',
    humanEval: 97.0,
    mmlu: 92.0,
    gsm8k: 99.0,
    hePlus: 95.0,
    swe: 72.0,
    context: '200K',
    contextK: 200,
    year: '2025',
    type: 'Reasoning',
    score: 95,
  },
  codex2: {
    name: 'Codex (davinci-002)',
    maker: 'OpenAI',
    icon: '⌨️',
    color: '#ef4444',
    humanEval: 72.0,
    mmlu: 0,
    gsm8k: 64.0,
    hePlus: 56.4,
    swe: 1.0,
    context: '8K',
    contextK: 8,
    year: '2022',
    type: 'Code Completion',
    score: 61,
  },
  codex1: {
    name: 'Codex (cushman-002)',
    maker: 'OpenAI',
    icon: '⌨️',
    color: '#f87171',
    humanEval: 45.0,
    mmlu: 0,
    gsm8k: 35.0,
    hePlus: 38.0,
    swe: 0.1,
    context: '2K',
    contextK: 2,
    year: '2021',
    type: 'Code Completion',
    score: 48,
  },
};

let activeModel = 'opus3';


/* ──────────────────────────────────────────────────────────
   3. NAVBAR — highlight active section on scroll + toggle
   ────────────────────────────────────────────────────────── */
(function initNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.querySelector('.nav-links');
  toggle?.addEventListener('click', () => links?.classList.toggle('open'));

  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => links?.classList.remove('open'));
  });

  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a[data-section]');

  function onScroll() {
    const scrollY = window.scrollY + 100;
    sections.forEach((s) => {
      if (scrollY >= s.offsetTop && scrollY < s.offsetTop + s.offsetHeight) {
        navLinks.forEach((a) => {
          a.classList.toggle('active', a.dataset.section === s.id);
        });
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ──────────────────────────────────────────────────────────
   4. HERO COUNTER ANIMATION
   ────────────────────────────────────────────────────────── */
(function initCounters() {
  const nums = document.querySelectorAll('.stat-num[data-target]');
  let started = false;

  function animateNum(el) {
    const target = parseFloat(el.dataset.target);
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = target % 1 === 0
        ? Math.round(ease * target)
        : (ease * target).toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting) && !started) {
      started = true;
      nums.forEach((n, i) => setTimeout(() => animateNum(n), i * 120));
    }
  });
  nums.forEach((n) => observer.observe(n));
})();


/* ──────────────────────────────────────────────────────────
   5. REVEAL ON SCROLL
   ────────────────────────────────────────────────────────── */
(function initReveal() {
  document.querySelectorAll('.skeu-card, .rant-card, .stat-pill, .bench-table-wrap').forEach((el) => {
    el.classList.add('reveal');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();


/* ──────────────────────────────────────────────────────────
   6. MODEL SELECTOR — radio + card update
   ────────────────────────────────────────────────────────── */
(function initSelector() {
  const radios = document.querySelectorAll('input[name="model"]');
  radios.forEach(r => r.addEventListener('change', () => {
    activeModel = r.value;
    updateModelCard();
    updateAllCharts();
  }));

  /* Knob drag interaction */
  document.querySelectorAll('.knob').forEach((knob, idx) => {
    let dragging = false, startY = 0, startVal = 0;
    knob.addEventListener('mousedown', (e) => {
      dragging = true;
      startY   = e.clientY;
      startVal = parseInt(knob.dataset.value) || 0;
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const delta = Math.round((startY - e.clientY) / 2);
      const newVal = Math.max(0, Math.min(100, startVal + delta));
      knob.dataset.value = newVal;
      knob.style.transform = `rotate(${(newVal - 50) * 2.7}deg)`;
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  });
})();

function updateModelCard() {
  const m = MODELS[activeModel] || MODELS.opus3;
  document.getElementById('mcIcon').textContent  = m.icon;
  document.getElementById('mcName').textContent  = m.name;
  document.getElementById('mcMaker').textContent = m.maker;
  document.getElementById('mcContext').textContent = m.context + ' ctx';
  document.getElementById('mcYear').textContent  = m.year;
  document.getElementById('mcType').textContent  = m.type;

  function setBar(id, valId, val) {
    const el = document.getElementById(id);
    const vl = document.getElementById(valId);
    if (!el || !vl) return;
    el.style.width = val + '%';
    vl.textContent = val > 0 ? val + '%' : 'N/A';
  }
  setBar('mcHumanEval', 'mcHumanEvalVal', m.humanEval);
  setBar('mcMMLU',      'mcMMLUVal',      m.mmlu);
  setBar('mcGSM8K',     'mcGSM8KVal',     m.gsm8k);
  setBar('mcHEPlus',    'mcHEPlusVal',     m.hePlus);
  setBar('mcSWE',       'mcSWEVal',        m.swe);
}


/* ──────────────────────────────────────────────────────────
   7. BENCHMARK TABLE — filter pills
   ────────────────────────────────────────────────────────── */
(function initTableFilter() {
  const pills = document.querySelectorAll('.filter-pill');
  const rows  = document.querySelectorAll('#benchTable tbody tr');

  pills.forEach(p => p.addEventListener('click', () => {
    pills.forEach(pp => pp.classList.remove('active'));
    p.classList.add('active');
    const filter = p.dataset.filter;
    rows.forEach(r => {
      const cat = r.dataset.cat || '';
      r.classList.toggle('hidden', filter !== 'all' && !cat.includes(filter));
    });
  }));
})();


/* ──────────────────────────────────────────────────────────
   8. CHART.JS GRAPHS
   ────────────────────────────────────────────────────────── */
let mainChartInstance = null;
let quadrantInstance  = null;
let currentChartType  = 'bar';

const CHART_MODELS = ['opus4','opus3','sonnet','gpt4o','o3','codex2'];
const LABELS = ['HumanEval','HumanEval+','MMLU','GSM8K','SWE-bench×5'];

function getDatasets() {
  return CHART_MODELS.map(key => {
    const m = MODELS[key];
    return {
      label: m.name,
      data: [m.humanEval, m.hePlus, m.mmlu, m.gsm8k, m.swe * 5],
      backgroundColor: m.color + '99',
      borderColor: m.color,
      borderWidth: 2,
      pointBackgroundColor: m.color,
      pointRadius: 5,
    };
  });
}

const chartDefaults = {
  color: '#8892a4',
  plugins: {
    legend: {
      labels: { color: '#8892a4', font: { family: 'Inter', size: 11 } }
    },
    tooltip: {
      backgroundColor: 'rgba(15,18,32,0.95)',
      borderColor: '#2e3550',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#8892a4',
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? ctx.parsed.r ?? ctx.raw}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#8892a4', font: { size: 11 } },
      grid:  { color: 'rgba(255,255,255,.05)' },
    },
    y: {
      min: 0, max: 100,
      ticks: { color: '#8892a4', font: { size: 11 }, callback: v => v + '%' },
      grid:  { color: 'rgba(255,255,255,.05)' },
    },
  },
};

function buildBarChart(ctx) {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels: LABELS, datasets: getDatasets() },
    options: {
      responsive: true,
      animation: { duration: 700 },
      ...chartDefaults,
      scales: {
        ...chartDefaults.scales,
        x: { ...chartDefaults.scales.x, stacked: false },
        y: { ...chartDefaults.scales.y },
      },
    },
  });
}

function buildRadarChart(ctx) {
  return new Chart(ctx, {
    type: 'radar',
    data: { labels: LABELS, datasets: getDatasets() },
    options: {
      responsive: true,
      animation: { duration: 700 },
      plugins: chartDefaults.plugins,
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { color: '#4a5568', backdropColor: 'transparent', stepSize: 20 },
          grid:  { color: 'rgba(255,255,255,.08)' },
          pointLabels: { color: '#8892a4', font: { size: 11 } },
          angleLines: { color: 'rgba(255,255,255,.06)' },
        },
      },
    },
  });
}

function buildLineChart(ctx) {
  const years = ['2021','2022','2023','2024','2025'];
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Anthropic Best Model (HumanEval)',
          data: [null, null, 72.0, 84.9, 92.0],
          borderColor: '#7c5cfc',
          backgroundColor: 'rgba(124,92,252,.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
        },
        {
          label: 'OpenAI Best Codex Model (HumanEval)',
          data: [45.0, 72.0, 72.0, 90.2, 97.0],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
        },
        {
          // Reflects the model GitHub Copilot provided students at each point in time.
          // Repeated values show periods when the available model did not change year-over-year.
          label: 'GitHub Copilot Model Available to Students',
          data: [null, 45.0, 45.0, 72.0, 72.0],
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,.08)',
          fill: true,
          tension: 0.4,
          borderDash: [6,4],
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 700 },
      ...chartDefaults,
      scales: {
        ...chartDefaults.scales,
        y: { ...chartDefaults.scales.y, min: 0, max: 100 },
      },
    },
  });
}

function buildBubbleChart(ctx) {
  const bubbleData = CHART_MODELS.map(key => {
    const m = MODELS[key];
    return {
      label: m.name,
      data: [{
        x: m.contextK,
        y: m.humanEval,
        r: Math.max(4, m.score / 8),
      }],
      backgroundColor: m.color + 'bb',
      borderColor: m.color,
      borderWidth: 2,
    };
  });
  return new Chart(ctx, {
    type: 'bubble',
    data: { datasets: bubbleData },
    options: {
      responsive: true,
      animation: { duration: 700 },
      plugins: chartDefaults.plugins,
      scales: {
        x: {
          type: 'logarithmic',
          title: { display: true, text: 'Context Window (K tokens, log)', color: '#8892a4' },
          ticks: { color: '#8892a4', callback: v => v + 'K' },
          grid: { color: 'rgba(255,255,255,.05)' },
        },
        y: {
          min: 30, max: 100,
          title: { display: true, text: 'HumanEval Score (%)', color: '#8892a4' },
          ticks: { color: '#8892a4', callback: v => v + '%' },
          grid: { color: 'rgba(255,255,255,.05)' },
        },
      },
    },
  });
}

function initMainChart() {
  const ctx = document.getElementById('mainChart').getContext('2d');
  mainChartInstance = buildBarChart(ctx);
}

function initQuadrantChart() {
  const ctx = document.getElementById('quadrantChart').getContext('2d');
  // Speed is inverse of context window as proxy; quality = score
  const qData = CHART_MODELS.map(key => {
    const m = MODELS[key];
    // Approximate relative inference speed (0–100) for the quadrant chart.
    // Faster/lighter models score higher; large reasoning models score lower.
    const SPEED_MAP = { codex1: 95, codex2: 90, haiku: 85, sonnet: 70,
                        gpt4o: 65, opus3: 50, opus4: 48, o3: 40 };
    const speed   = SPEED_MAP[key] ?? 55;
    const quality = m.score;
    return { x: speed, y: quality, label: m.name, color: m.color };
  });

  quadrantInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: qData.map(d => ({
        label: d.label,
        data: [{ x: d.x, y: d.y }],
        backgroundColor: d.color + 'bb',
        borderColor: d.color,
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 13,
      })),
    },
    options: {
      responsive: true,
      animation: { duration: 700 },
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}  Speed:${ctx.parsed.x}  Quality:${ctx.parsed.y}`,
          },
        },
        annotation: {},
      },
      scales: {
        x: {
          min: 0, max: 100,
          title: { display: true, text: 'Response Speed →', color: '#8892a4' },
          ticks: { color: '#8892a4' },
          grid: { color: 'rgba(255,255,255,.05)' },
        },
        y: {
          min: 0, max: 100,
          title: { display: true, text: 'Quality Score →', color: '#8892a4' },
          ticks: { color: '#8892a4' },
          grid: { color: 'rgba(255,255,255,.05)' },
        },
      },
    },
  });
}

function switchChart(type) {
  currentChartType = type;
  const canvas = document.getElementById('mainChart');
  if (mainChartInstance) { mainChartInstance.destroy(); mainChartInstance = null; }
  const ctx = canvas.getContext('2d');
  switch (type) {
    case 'bar':    mainChartInstance = buildBarChart(ctx);    break;
    case 'radar':  mainChartInstance = buildRadarChart(ctx);  break;
    case 'line':   mainChartInstance = buildLineChart(ctx);   break;
    case 'bubble': mainChartInstance = buildBubbleChart(ctx); break;
  }
}

(function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switchChart(tab.dataset.chart);
    });
  });
})();

function updateAllCharts() {
  /* highlight selected model in bar chart */
  if (mainChartInstance && currentChartType === 'bar') {
    mainChartInstance.data.datasets.forEach(ds => {
      const key = CHART_MODELS.find(k => MODELS[k].name === ds.label);
      if (key === activeModel) {
        ds.borderWidth = 3;
        ds.backgroundColor = MODELS[key].color + 'dd';
      } else {
        ds.borderWidth = 1;
        ds.backgroundColor = (MODELS[key] || {}).color + '44';
      }
    });
    mainChartInstance.update();
  }
}


/* ──────────────────────────────────────────────────────────
   9. CONTEXT WINDOW BARS
   ────────────────────────────────────────────────────────── */
function initContextBars() {
  const container = document.getElementById('ctxBars');
  if (!container) return;

  const items = [
    { name: 'Claude 3 Opus',         k: 200,  color: '#7c5cfc' },
    { name: 'Claude 3.5 Sonnet',     k: 200,  color: '#60a5fa' },
    { name: 'OpenAI o3',             k: 200,  color: '#f472b6' },
    { name: 'GPT-4o',                k: 128,  color: '#fb923c' },
    { name: 'Codex (davinci-002)',    k: 8,    color: '#ef4444' },
    { name: 'Codex (cushman-002)',    k: 2,    color: '#f87171' },
  ];
  const max = Math.max(...items.map(i => i.k));

  items.forEach(item => {
    const pct = (item.k / max) * 100;
    const row = document.createElement('div');
    row.className = 'ctx-bar-item';
    row.innerHTML = `
      <span class="ctx-bar-name">${item.name}</span>
      <div class="ctx-bar-track">
        <div class="ctx-bar-fill" style="background:${item.color};width:0"
             data-target="${pct}">${item.k}K</div>
      </div>
      <span class="ctx-bar-val">${item.k}K</span>
    `;
    container.appendChild(row);
  });

  /* animate in when visible */
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      container.querySelectorAll('.ctx-bar-fill').forEach(bar => {
        setTimeout(() => {
          bar.style.width = bar.dataset.target + '%';
        }, 100);
      });
      io.disconnect();
    }
  }, { threshold: 0.3 });
  io.observe(container);
}


/* ──────────────────────────────────────────────────────────
   10. RANT TERMINAL — typewriter effect
   ────────────────────────────────────────────────────────── */
function initRantTerminal() {
  const el = document.getElementById('rantText');
  if (!el) return;

  const text = `GitHub Education grants students access to hundreds of premium developer tools.
The Azure credits are generous. The JetBrains licenses are full-featured.
The GitHub Pro access unlocks private repos, Codespaces, and Actions minutes.

And then there's the AI model.

GitHub Copilot for students uses code-davinci-002 — a model that was
state-of-the-art in 2021. It was trained before ChatGPT existed. Before
retrieval-augmented generation. Before Constitutional AI. Before RLHF
became mainstream. Before anyone had proven that LLMs could reason.

Meanwhile, Claude 3 Opus exists. It:
  • Scores 84.9% on HumanEval  (vs Codex's 72%)
  • Scores 82.1% on HumanEval+ (vs Codex's 56.4%)  ← 46% gap
  • Has a 200,000-token context window (vs 8K)       ← 25× larger
  • Can read your ENTIRE codebase, understand
    architecture, and reason about trade-offs
  • Explains WHY code is correct, not just HOW
  • Catches security vulnerabilities in its reasoning
  • Writes production-quality tests unprompted

The argument that students shouldn't have access to the best AI tools
because of cost is a false economy. You are shaping how the next
generation of developers thinks about AI assistance. Giving them
inferior tools doesn't save money — it produces inferior engineers.

Fix this. Open Anthropic model access in GitHub Education. Now.`;

  let i = 0;
  el.classList.add('cursor-blink');

  function typeNext() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(typeNext, 12 + Math.random() * 8);
    } else {
      el.classList.remove('cursor-blink');
    }
  }

  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      setTimeout(typeNext, 800);
      io.disconnect();
    }
  }, { threshold: 0.2 });
  io.observe(el);
}


/* ──────────────────────────────────────────────────────────
   11. LIVE DEMO — simulated code comparison
   ────────────────────────────────────────────────────────── */
const DEMO_RESPONSES = {
  sieve: {
    opus: {
      code: `<span class="code-kw">from</span> <span class="code-fn">typing</span> <span class="code-kw">import</span> List


<span class="code-kw">def</span> <span class="code-fn">sieve_of_eratosthenes</span>(n: <span class="code-fn">int</span>) -> List[<span class="code-fn">int</span>]:
    <span class="code-str">"""Return all prime numbers up to n (inclusive).

    Uses the classical Sieve of Eratosthenes algorithm.
    Time complexity:  O(n log log n)
    Space complexity: O(n)

    Args:
        n: Upper bound (inclusive).

    Returns:
        A sorted list of prime numbers ≤ n.

    Raises:
        ValueError: If n &lt; 2.

    Examples:
        >>> sieve_of_eratosthenes(30)
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
        >>> sieve_of_eratosthenes(2)
        [2]
    """</span>
    <span class="code-kw">if</span> n &lt; <span class="code-num">2</span>:
        <span class="code-kw">raise</span> <span class="code-fn">ValueError</span>(<span class="code-str">f"n must be ≥ 2, got {n}"</span>)

    <span class="code-cmt"># Boolean sieve: True = still potentially prime</span>
    is_prime = [<span class="code-kw">True</span>] * (n + <span class="code-num">1</span>)
    is_prime[<span class="code-num">0</span>] = is_prime[<span class="code-num">1</span>] = <span class="code-kw">False</span>

    <span class="code-kw">for</span> p <span class="code-kw">in</span> <span class="code-fn">range</span>(<span class="code-num">2</span>, <span class="code-fn">int</span>(n ** <span class="code-num">0.5</span>) + <span class="code-num">1</span>):
        <span class="code-kw">if</span> is_prime[p]:
            <span class="code-cmt"># Mark multiples of p starting at p²</span>
            is_prime[p * p :: p] = [<span class="code-kw">False</span>] * <span class="code-fn">len</span>(is_prime[p * p :: p])

    <span class="code-kw">return</span> [i <span class="code-kw">for</span> i, prime <span class="code-kw">in</span> <span class="code-fn">enumerate</span>(is_prime) <span class="code-kw">if</span> prime]


<span class="code-kw">if</span> __name__ == <span class="code-str">"__main__"</span>:
    primes = <span class="code-fn">sieve_of_eratosthenes</span>(<span class="code-num">50</span>)
    <span class="code-fn">print</span>(<span class="code-str">f"Primes up to 50: {primes}"</span>)
    <span class="code-cmt"># Primes up to 50: [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47]</span>`,
      correct: '98%',
      explain: '10/10',
      edge: '9/10',
    },
    codex: {
      code: `<span class="code-kw">def</span> <span class="code-fn">sieve</span>(n):
    primes = []
    sieve = [<span class="code-kw">True</span>] * (n+<span class="code-num">1</span>)
    <span class="code-kw">for</span> p <span class="code-kw">in</span> <span class="code-fn">range</span>(<span class="code-num">2</span>, n+<span class="code-num">1</span>):
        <span class="code-kw">if</span> sieve[p]:
            primes.<span class="code-fn">append</span>(p)
            <span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-fn">range</span>(p*p, n+<span class="code-num">1</span>, p):
                sieve[i] = <span class="code-kw">False</span>
    <span class="code-kw">return</span> primes

<span class="code-cmt"># No type hints, no docstring, no error handling,</span>
<span class="code-cmt"># no example usage, inner loop is O(n) not O(√n)</span>`,
      correct: '75%',
      explain: '2/10',
      edge: '3/10',
    },
  },
  fibonacci: {
    opus: {
      code: `<span class="code-kw">from</span> <span class="code-fn">functools</span> <span class="code-kw">import</span> lru_cache
<span class="code-kw">from</span> <span class="code-fn">typing</span> <span class="code-kw">import</span> Dict


<span class="code-dec">@lru_cache</span>(maxsize=<span class="code-kw">None</span>)
<span class="code-kw">def</span> <span class="code-fn">fib</span>(n: <span class="code-fn">int</span>) -> <span class="code-fn">int</span>:
    <span class="code-str">"""Return the nth Fibonacci number (0-indexed, memoized).

    fib(0) = 0, fib(1) = 1, fib(n) = fib(n-1) + fib(n-2)

    Time:  O(n) amortized  Space: O(n) cache
    Thread-safe via CPython's GIL.

    Raises:
        ValueError: If n &lt; 0.
    """</span>
    <span class="code-kw">if</span> n &lt; <span class="code-num">0</span>:
        <span class="code-kw">raise</span> <span class="code-fn">ValueError</span>(<span class="code-str">f"n must be non-negative, got {n}"</span>)
    <span class="code-kw">if</span> n &lt;= <span class="code-num">1</span>:
        <span class="code-kw">return</span> n
    <span class="code-kw">return</span> <span class="code-fn">fib</span>(n - <span class="code-num">1</span>) + <span class="code-fn">fib</span>(n - <span class="code-num">2</span>)


<span class="code-cmt"># Usage</span>
<span class="code-fn">print</span>([<span class="code-fn">fib</span>(i) <span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-fn">range</span>(<span class="code-num">10</span>)])
<span class="code-cmt"># [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]</span>`,
      correct: '99%',
      explain: '10/10',
      edge: '9/10',
    },
    codex: {
      code: `<span class="code-kw">def</span> <span class="code-fn">fib</span>(n, memo={}):
    <span class="code-kw">if</span> n <span class="code-kw">in</span> memo:
        <span class="code-kw">return</span> memo[n]
    <span class="code-kw">if</span> n &lt;= <span class="code-num">1</span>:
        <span class="code-kw">return</span> n
    memo[n] = <span class="code-fn">fib</span>(n-<span class="code-num">1</span>, memo) + <span class="code-fn">fib</span>(n-<span class="code-num">2</span>, memo)
    <span class="code-kw">return</span> memo[n]

<span class="code-cmt"># BUG: mutable default argument is shared across calls!</span>
<span class="code-cmt"># No type hints, no docstring, no negative-n guard</span>`,
      correct: '65%',
      explain: '2/10',
      edge: '2/10',
    },
  },
  lru: {
    opus: {
      code: `<span class="code-kw">from</span> <span class="code-fn">collections</span> <span class="code-kw">import</span> OrderedDict
<span class="code-kw">from</span> <span class="code-fn">threading</span> <span class="code-kw">import</span> Lock
<span class="code-kw">from</span> <span class="code-fn">typing</span> <span class="code-kw">import</span> Generic, TypeVar, Optional

K = TypeVar(<span class="code-str">"K"</span>)
V = TypeVar(<span class="code-str">"V"</span>)


<span class="code-kw">class</span> <span class="code-fn">LRUCache</span>(Generic[K, V]):
    <span class="code-str">"""Thread-safe LRU cache with O(1) get and put.

    Uses OrderedDict to maintain insertion/access order.
    A threading.Lock guards all mutations for thread safety.
    """</span>

    <span class="code-kw">def</span> <span class="code-fn">__init__</span>(<span class="code-kw">self</span>, capacity: <span class="code-fn">int</span>) -> <span class="code-kw">None</span>:
        <span class="code-kw">if</span> capacity &lt;= <span class="code-num">0</span>:
            <span class="code-kw">raise</span> <span class="code-fn">ValueError</span>(<span class="code-str">"capacity must be positive"</span>)
        <span class="code-kw">self</span>.capacity = capacity
        <span class="code-kw">self</span>._cache: OrderedDict[K, V] = <span class="code-fn">OrderedDict</span>()
        <span class="code-kw">self</span>._lock = <span class="code-fn">Lock</span>()

    <span class="code-kw">def</span> <span class="code-fn">get</span>(<span class="code-kw">self</span>, key: K) -> Optional[V]:
        <span class="code-kw">with</span> <span class="code-kw">self</span>._lock:
            <span class="code-kw">if</span> key <span class="code-kw">not in</span> <span class="code-kw">self</span>._cache:
                <span class="code-kw">return None</span>
            <span class="code-kw">self</span>._cache.<span class="code-fn">move_to_end</span>(key)
            <span class="code-kw">return self</span>._cache[key]

    <span class="code-kw">def</span> <span class="code-fn">put</span>(<span class="code-kw">self</span>, key: K, value: V) -> <span class="code-kw">None</span>:
        <span class="code-kw">with self</span>._lock:
            <span class="code-kw">if</span> key <span class="code-kw">in self</span>._cache:
                <span class="code-kw">self</span>._cache.<span class="code-fn">move_to_end</span>(key)
            <span class="code-kw">self</span>._cache[key] = value
            <span class="code-kw">if len</span>(<span class="code-kw">self</span>._cache) > <span class="code-kw">self</span>.capacity:
                <span class="code-kw">self</span>._cache.<span class="code-fn">popitem</span>(last=<span class="code-kw">False</span>)`,
      correct: '99%',
      explain: '10/10',
      edge: '10/10',
    },
    codex: {
      code: `<span class="code-kw">class</span> <span class="code-fn">LRUCache</span>:
    <span class="code-kw">def</span> <span class="code-fn">__init__</span>(<span class="code-kw">self</span>, capacity):
        <span class="code-kw">self</span>.capacity = capacity
        <span class="code-kw">self</span>.cache = {}
        <span class="code-kw">self</span>.order = []

    <span class="code-kw">def</span> <span class="code-fn">get</span>(<span class="code-kw">self</span>, key):
        <span class="code-kw">if</span> key <span class="code-kw">in self</span>.cache:
            <span class="code-kw">self</span>.order.<span class="code-fn">remove</span>(key)  <span class="code-cmt"># O(n)!</span>
            <span class="code-kw">self</span>.order.<span class="code-fn">append</span>(key)
            <span class="code-kw">return self</span>.cache[key]
        <span class="code-kw">return</span> -<span class="code-num">1</span>

    <span class="code-kw">def</span> <span class="code-fn">put</span>(<span class="code-kw">self</span>, key, value):
        <span class="code-kw">if</span> key <span class="code-kw">in self</span>.cache:
            <span class="code-kw">self</span>.order.<span class="code-fn">remove</span>(key)  <span class="code-cmt"># O(n)!</span>
        <span class="code-kw">elif len</span>(<span class="code-kw">self</span>.cache) >= <span class="code-kw">self</span>.capacity:
            evict = <span class="code-kw">self</span>.order.<span class="code-fn">pop</span>(<span class="code-num">0</span>)
            <span class="code-kw">del self</span>.cache[evict]
        <span class="code-kw">self</span>.cache[key] = value
        <span class="code-kw">self</span>.order.<span class="code-fn">append</span>(key)

<span class="code-cmt"># BUG: get/put are O(n) not O(1). Not thread-safe.</span>
<span class="code-cmt"># No type hints, no generics, returns -1 not None.</span>`,
      correct: '55%',
      explain: '2/10',
      edge: '2/10',
    },
  },
  cycle: {
    opus: {
      code: `<span class="code-kw">from</span> <span class="code-fn">typing</span> <span class="code-kw">import</span> Dict, List, Set


<span class="code-kw">def</span> <span class="code-fn">has_cycle</span>(graph: Dict[<span class="code-fn">int</span>, List[<span class="code-fn">int</span>]]) -> <span class="code-fn">bool</span>:
    <span class="code-str">"""Detect if a directed graph contains a cycle using DFS.

    Uses three-color marking: WHITE (0), GRAY (in-stack), BLACK (done).
    A back edge (to a GRAY node) means a cycle exists.

    Time:  O(V + E)   Space: O(V)

    Args:
        graph: Adjacency list {node: [neighbors]}.

    Returns:
        True if a cycle exists, False otherwise.
    """</span>
    WHITE, GRAY, BLACK = <span class="code-num">0</span>, <span class="code-num">1</span>, <span class="code-num">2</span>
    color: Dict[<span class="code-fn">int</span>, <span class="code-fn">int</span>] = {v: WHITE <span class="code-kw">for</span> v <span class="code-kw">in</span> graph}

    <span class="code-kw">def</span> <span class="code-fn">dfs</span>(v: <span class="code-fn">int</span>) -> <span class="code-fn">bool</span>:
        color[v] = GRAY
        <span class="code-kw">for</span> w <span class="code-kw">in</span> graph.<span class="code-fn">get</span>(v, []):
            <span class="code-kw">if</span> w <span class="code-kw">not in</span> color:   <span class="code-cmt"># unseen node</span>
                color[w] = WHITE
            <span class="code-kw">if</span> color[w] == GRAY:  <span class="code-cmt"># back edge → cycle</span>
                <span class="code-kw">return True</span>
            <span class="code-kw">if</span> color[w] == WHITE <span class="code-kw">and</span> <span class="code-fn">dfs</span>(w):
                <span class="code-kw">return True</span>
        color[v] = BLACK
        <span class="code-kw">return False</span>

    <span class="code-kw">return any</span>(<span class="code-fn">dfs</span>(v) <span class="code-kw">for</span> v, c <span class="code-kw">in</span> color.<span class="code-fn">items</span>() <span class="code-kw">if</span> c == WHITE)`,
      correct: '99%',
      explain: '10/10',
      edge: '10/10',
    },
    codex: {
      code: `<span class="code-kw">def</span> <span class="code-fn">has_cycle</span>(graph):
    visited = <span class="code-fn">set</span>()
    rec_stack = <span class="code-fn">set</span>()

    <span class="code-kw">def</span> <span class="code-fn">dfs</span>(v):
        visited.<span class="code-fn">add</span>(v)
        rec_stack.<span class="code-fn">add</span>(v)
        <span class="code-kw">for</span> w <span class="code-kw">in</span> graph.<span class="code-fn">get</span>(v, []):
            <span class="code-kw">if</span> w <span class="code-kw">not in</span> visited:
                <span class="code-kw">if</span> <span class="code-fn">dfs</span>(w): <span class="code-kw">return True</span>
            <span class="code-kw">elif</span> w <span class="code-kw">in</span> rec_stack:
                <span class="code-kw">return True</span>
        rec_stack.<span class="code-fn">discard</span>(v)
        <span class="code-kw">return False</span>

    <span class="code-kw">return any</span>(<span class="code-fn">dfs</span>(v) <span class="code-kw">for</span> v <span class="code-kw">in</span> graph <span class="code-kw">if</span> v <span class="code-kw">not in</span> visited)

<span class="code-cmt"># No type hints. No docstring. Misses nodes with no outgoing edges.</span>`,
      correct: '72%',
      explain: '3/10',
      edge: '4/10',
    },
  },
  bst: {
    opus: {
      code: `<span class="code-kw">from</span> <span class="code-fn">__future__</span> <span class="code-kw">import</span> annotations
<span class="code-kw">from</span> <span class="code-fn">typing</span> <span class="code-kw">import</span> Optional, Iterator


<span class="code-kw">class</span> <span class="code-fn">BSTNode</span>:
    <span class="code-kw">def</span> <span class="code-fn">__init__</span>(<span class="code-kw">self</span>, val: <span class="code-fn">int</span>):
        <span class="code-kw">self</span>.val = val
        <span class="code-kw">self</span>.left:  Optional[BSTNode] = <span class="code-kw">None</span>
        <span class="code-kw">self</span>.right: Optional[BSTNode] = <span class="code-kw">None</span>


<span class="code-kw">class</span> <span class="code-fn">BST</span>:
    <span class="code-str">"""Binary Search Tree with insert, delete, and in-order traversal."""</span>

    <span class="code-kw">def</span> <span class="code-fn">__init__</span>(<span class="code-kw">self</span>):
        <span class="code-kw">self</span>.root: Optional[BSTNode] = <span class="code-kw">None</span>

    <span class="code-kw">def</span> <span class="code-fn">insert</span>(<span class="code-kw">self</span>, val: <span class="code-fn">int</span>) -> <span class="code-kw">None</span>:
        <span class="code-kw">self</span>.root = <span class="code-kw">self</span>.<span class="code-fn">_insert</span>(<span class="code-kw">self</span>.root, val)

    <span class="code-kw">def</span> <span class="code-fn">_insert</span>(<span class="code-kw">self</span>, node, val):
        <span class="code-kw">if not</span> node: <span class="code-kw">return</span> <span class="code-fn">BSTNode</span>(val)
        <span class="code-kw">if</span>   val &lt; node.val: node.left  = <span class="code-kw">self</span>.<span class="code-fn">_insert</span>(node.left,  val)
        <span class="code-kw">elif</span> val > node.val: node.right = <span class="code-kw">self</span>.<span class="code-fn">_insert</span>(node.right, val)
        <span class="code-kw">return</span> node  <span class="code-cmt"># duplicate ignored</span>

    <span class="code-kw">def</span> <span class="code-fn">delete</span>(<span class="code-kw">self</span>, val: <span class="code-fn">int</span>) -> <span class="code-kw">None</span>:
        <span class="code-kw">self</span>.root = <span class="code-kw">self</span>.<span class="code-fn">_delete</span>(<span class="code-kw">self</span>.root, val)

    <span class="code-kw">def</span> <span class="code-fn">_delete</span>(<span class="code-kw">self</span>, node, val):
        <span class="code-kw">if not</span> node: <span class="code-kw">return None</span>
        <span class="code-kw">if</span>   val &lt; node.val: node.left  = <span class="code-kw">self</span>.<span class="code-fn">_delete</span>(node.left,  val)
        <span class="code-kw">elif</span> val > node.val: node.right = <span class="code-kw">self</span>.<span class="code-fn">_delete</span>(node.right, val)
        <span class="code-kw">else</span>:
            <span class="code-kw">if not</span> node.left:  <span class="code-kw">return</span> node.right
            <span class="code-kw">if not</span> node.right: <span class="code-kw">return</span> node.left
            <span class="code-cmt"># Two children: replace with in-order successor</span>
            succ = node.right
            <span class="code-kw">while</span> succ.left: succ = succ.left
            node.val   = succ.val
            node.right = <span class="code-kw">self</span>.<span class="code-fn">_delete</span>(node.right, succ.val)
        <span class="code-kw">return</span> node

    <span class="code-kw">def</span> <span class="code-fn">inorder</span>(<span class="code-kw">self</span>) -> Iterator[<span class="code-fn">int</span>]:
        <span class="code-str">"""Yield values in sorted order."""</span>
        <span class="code-kw">yield from self</span>.<span class="code-fn">_inorder</span>(<span class="code-kw">self</span>.root)

    <span class="code-kw">def</span> <span class="code-fn">_inorder</span>(<span class="code-kw">self</span>, node):
        <span class="code-kw">if</span> node:
            <span class="code-kw">yield from self</span>.<span class="code-fn">_inorder</span>(node.left)
            <span class="code-kw">yield</span> node.val
            <span class="code-kw">yield from self</span>.<span class="code-fn">_inorder</span>(node.right)`,
      correct: '100%',
      explain: '10/10',
      edge: '10/10',
    },
    codex: {
      code: `<span class="code-kw">class</span> <span class="code-fn">BST</span>:
    <span class="code-kw">def</span> <span class="code-fn">__init__</span>(<span class="code-kw">self</span>):
        <span class="code-kw">self</span>.root = <span class="code-kw">None</span>

    <span class="code-kw">def</span> <span class="code-fn">insert</span>(<span class="code-kw">self</span>, val):
        node = Node(val)
        <span class="code-kw">if not self</span>.root:
            <span class="code-kw">self</span>.root = node; <span class="code-kw">return</span>
        cur = <span class="code-kw">self</span>.root
        <span class="code-kw">while True</span>:
            <span class="code-kw">if</span> val &lt; cur.val:
                <span class="code-kw">if not</span> cur.left: cur.left = node; <span class="code-kw">break</span>
                cur = cur.left
            <span class="code-kw">else</span>:
                <span class="code-kw">if not</span> cur.right: cur.right = node; <span class="code-kw">break</span>
                cur = cur.right

    <span class="code-kw">def</span> <span class="code-fn">inorder</span>(<span class="code-kw">self</span>):
        <span class="code-kw">return self</span>.<span class="code-fn">_inorder</span>(<span class="code-kw">self</span>.root, [])

    <span class="code-kw">def</span> <span class="code-fn">_inorder</span>(<span class="code-kw">self</span>, node, res):
        <span class="code-kw">if</span> node:
            <span class="code-kw">self</span>.<span class="code-fn">_inorder</span>(node.left, res)
            res.<span class="code-fn">append</span>(node.val)
            <span class="code-kw">self</span>.<span class="code-fn">_inorder</span>(node.right, res)
        <span class="code-kw">return</span> res

<span class="code-cmt"># Missing: Node class definition! Code doesn't run.</span>
<span class="code-cmt"># Missing: delete() method entirely. No type hints.</span>`,
      correct: '35%',
      explain: '2/10',
      edge: '1/10',
    },
  },
};

function getDefaultDemo() {
  return { key: 'sieve', data: DEMO_RESPONSES.sieve };
}

function matchPromptToDemo(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('fibonacci') || p.includes('fib')) return { key: 'fibonacci', data: DEMO_RESPONSES.fibonacci };
  if (p.includes('lru'))                             return { key: 'lru',       data: DEMO_RESPONSES.lru };
  if (p.includes('cycle'))                           return { key: 'cycle',     data: DEMO_RESPONSES.cycle };
  if (p.includes('bst') || p.includes('binary search tree')) return { key: 'bst', data: DEMO_RESPONSES.bst };
  if (p.includes('sieve') || p.includes('prime'))   return { key: 'sieve',     data: DEMO_RESPONSES.sieve };
  return getDefaultDemo();
}

function typeCode(el, html, onDone) {
  el.innerHTML = '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const plain = tmp.textContent;
  let i = 0;
  let current = '';

  function tick() {
    if (i >= plain.length) {
      el.innerHTML = html;
      if (onDone) onDone();
      return;
    }
    current += plain[i++];
    el.textContent = current;
    setTimeout(tick, 6);
  }
  tick();
}

(function initDemo() {
  const runBtn    = document.getElementById('runDemo');
  const textarea  = document.getElementById('demoPrompt');
  const verdict   = document.getElementById('demoVerdict');
  const verdictFill = document.getElementById('verdictFill');
  const verdictText = document.getElementById('verdictText');

  /* preset buttons */
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      textarea.value = btn.dataset.prompt;
    });
  });

  runBtn?.addEventListener('click', () => {
    const match = matchPromptToDemo(textarea.value);
    const { data } = match;

    /* reset */
    verdict.style.display = 'none';
    document.getElementById('opusCode').innerHTML  = '<span class="code-cmt">// Generating…</span>';
    document.getElementById('codexCode').innerHTML = '<span class="code-cmt">// Generating…</span>';

    /* score badges */
    ['opusCorrect','opusExplain','opusEdge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '…';
    });
    ['codexCorrect','codexExplain','codexEdge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '…';
    });

    /* type Opus code */
    setTimeout(() => {
      typeCode(document.getElementById('opusCode'), data.opus.code, () => {
        document.getElementById('opusCorrect').textContent = '✓ ' + data.opus.correct;
        document.getElementById('opusExplain').textContent = '📖 ' + data.opus.explain;
        document.getElementById('opusEdge').textContent    = '🔍 ' + data.opus.edge;
        showVerdict(data);
      });
    }, 300);

    /* type Codex code */
    setTimeout(() => {
      typeCode(document.getElementById('codexCode'), data.codex.code);
    }, 600);

    function showVerdict(d) {
      const opusNum  = parseFloat(d.opus.correct);
      const codexNum = parseFloat(d.codex.correct);
      const codexShare = (codexNum / (opusNum + codexNum)) * 100;

      verdictFill.style.width = codexShare + '%';
      const diff = opusNum - codexNum;
      verdictText.textContent = `Claude Opus outscores Codex by ${diff.toFixed(0)} percentage points on correctness alone.`;

      verdict.style.display = 'block';

      document.getElementById('codexCorrect').textContent = '✗ ' + d.codex.correct;
      document.getElementById('codexExplain').textContent = '📖 ' + d.codex.explain;
      document.getElementById('codexEdge').textContent    = '🔍 ' + d.codex.edge;
    }
  });
})();


/* ──────────────────────────────────────────────────────────
   12. INIT ALL
   ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateModelCard();
  initMainChart();
  initQuadrantChart();
  initContextBars();
  initRantTerminal();
});
