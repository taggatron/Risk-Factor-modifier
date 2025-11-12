/* Risk Factor Modifier Game */

const BASE_LIFESPAN = 85; // years
const factors = {
  // Risk factors (red)
  smoking:       { weightYears: 12, value: 0, type: 'risk' },
  diet:          { weightYears:  8, value: 0, type: 'risk' },
  exercise:      { weightYears:  7, value: 0, type: 'risk' }, // represents inactivity risk
  bloodPressure: { weightYears:  7, value: 0, type: 'risk' },
  cholesterol:   { weightYears:  6, value: 0, type: 'risk' },

  // Protective factors (green)
  education:     { weightYears:  6, value: 0, type: 'protect' },
  wealth:        { weightYears:  5, value: 0, type: 'protect' },
  happiness:     { weightYears:  7, value: 0, type: 'protect' }
};

let state = {
  running: false,
  age: 0,
  predictedLifespan: BASE_LIFESPAN,
  startTime: null,
  lastTick: null,
  // animation speed: how many years per real second at baseline
  yearsPerSecond: 3,
  // when death happens, run death sequence
  dead: false
};

// DOM refs
const ageDisplay = document.getElementById('ageDisplay');
const lifespanDisplay = document.getElementById('lifespanDisplay');
const goBtn = document.getElementById('goBtn');
const resetBtn = document.getElementById('resetBtn');
const dialEls = Array.from(document.querySelectorAll('.dial'));

// SVG refs
const character = document.getElementById('character');
const posture = document.getElementById('posture');
const hairGradStop = document.getElementById('hairGradStop');
const cane = document.getElementById('cane');
const head = document.getElementById('head');

// Utils
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function lerp(a, b, t){ return a + (b - a) * t; }
function easeInOut(t){ return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }

function computePredictedLifespan(){
  let delta = 0; // positive increases lifespan, negative reduces
  for(const key in factors){
    const f = factors[key];
    const contrib = (f.value/100) * f.weightYears;
    delta += (f.type === 'protect') ? contrib : -contrib;
  }
  const lifespan = clamp(Math.round(BASE_LIFESPAN + delta), 35, 105);
  state.predictedLifespan = lifespan;
  lifespanDisplay.textContent = lifespan;
}

function updateDialVisual(dial){
  const face = dial.querySelector('.dial__face');
  const valueEl = dial.querySelector('.dial__value');
  const key = dial.dataset.key;
  const v = clamp(factors[key].value, 0, 100);
  face.style.setProperty('--v', v);
  face.setAttribute('aria-valuenow', String(Math.round(v)));
  valueEl.textContent = Math.round(v);
}

function setupDials(){
  dialEls.forEach(dial => {
    const key = dial.dataset.key;
    // initialize
    factors[key].value = 0;
    updateDialVisual(dial);

    const face = dial.querySelector('.dial__face');

    const setFromEvent = (clientX, clientY) => {
      const rect = face.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx); // -PI..PI, 0 pointing right
      angle = angle * 180/Math.PI; // degrees
      angle = (angle + 450) % 360; // convert so 0 is up, clockwise positive
      const value = clamp(Math.round((angle/360) * 100), 0, 100);
      factors[key].value = value;
      updateDialVisual(dial);
      computePredictedLifespan();
    };

    let dragging = false;
    const onMove = (e) => {
      if(!dragging) return;
      if(e.touches && e.touches[0]){
        setFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      } else {
        setFromEvent(e.clientX, e.clientY);
      }
    };

    face.addEventListener('pointerdown', (e) => { dragging = true; face.setPointerCapture(e.pointerId); setFromEvent(e.clientX, e.clientY); });
    face.addEventListener('pointermove', onMove);
    face.addEventListener('pointerup', () => dragging = false);
    face.addEventListener('pointercancel', () => dragging = false);

    // Keyboard fallback
    face.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){
        factors[key].value = clamp(factors[key].value + 2, 0, 100);
        updateDialVisual(dial); computePredictedLifespan();
      } else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){
        factors[key].value = clamp(factors[key].value - 2, 0, 100);
        updateDialVisual(dial); computePredictedLifespan();
      }
    });
  });

  computePredictedLifespan();
}

function formatAge(age){
  return Math.floor(age);
}

function updateAgeDisplay(){
  ageDisplay.textContent = formatAge(state.age);
}

function updateCharacterByAge(){
  const L = state.predictedLifespan;
  const age = state.age;
  const t = clamp(age / L, 0, 1);

  // Growth: from child to adult ~ 0-18 years
  const growthT = clamp(age / 18, 0, 1);
  const adultScale = lerp(0.75, 1.0, easeInOut(growthT));

  // Later-life shrink a bit after 70% of lifespan
  const seniorT = clamp((t - 0.7) / 0.3, 0, 1);
  const seniorScale = lerp(1.0, 0.9, seniorT);
  const scale = adultScale * seniorScale;

  // Posture tilt increases with age (up to ~18deg)
  const tilt = lerp(0, 18, Math.pow(t, 1.2));

  // Hair greys from mid-life onward
  const greyT = clamp((t - 0.45) / 0.55, 0, 1);
  const grey = Math.round(lerp(180, 230, greyT));
  hairGradStop.setAttribute('stop-color', `rgb(${grey},${grey},${grey})`);

  // Cane appears late life
  cane.setAttribute('opacity', String(lerp(0, 1, clamp((t - 0.75)/0.25, 0, 1))));

  // Head size slightly reduces later
  head.setAttribute('r', String(lerp(16, 14.5, seniorT)));

  // Apply transforms
  character.setAttribute('transform', `translate(150, 230) scale(${scale.toFixed(3)})`);
  posture.setAttribute('transform', `rotate(${tilt.toFixed(2)})`);
}

function runDeathAnimation(){
  // Character collapses and fades
  let deathStart = null;
  const deathDuration = 1500;
  const startTransform = { x: 150, y: 230, rot: 0, scale: 1 };
  function step(ts){
    if(!deathStart) deathStart = ts;
    const d = ts - deathStart;
    const k = clamp(d / deathDuration, 0, 1);
    const e = easeInOut(k);
    // Rotate to lay down, drop a little
    const rot = lerp(0, 90, e);
    const y = lerp(230, 245, e);
    const scale = lerp(1, 0.96, e);
    character.setAttribute('transform', `translate(150, ${y.toFixed(2)}) scale(${scale.toFixed(3)})`);
    posture.setAttribute('transform', `rotate(${rot.toFixed(2)})`);
    // subtle fade by reducing stroke/opacity
    const alpha = 1 - 0.6*e;
    character.style.opacity = String(alpha);
    if(k < 1){
      requestAnimationFrame(step);
    } else {
      state.dead = true;
    }
  }
  requestAnimationFrame(step);
}

function tick(ts){
  if(!state.running) return; // paused or finished
  if(!state.lastTick) state.lastTick = ts;
  const dt = (ts - state.lastTick) / 1000; // seconds
  state.lastTick = ts;

  // Risk also affects speed: higher risk -> faster years per second (life passes quicker)
  // riskMultiplier speeds time when lifespan is reduced, slows when increased
  const spanDelta = BASE_LIFESPAN - state.predictedLifespan; // negative if healthier
  const riskMultiplier = 1 + clamp(spanDelta, -20, 60) / 60; // ~0.67x to ~2x
  const yearsThisFrame = dt * state.yearsPerSecond * riskMultiplier;
  state.age += yearsThisFrame;
  if(state.age >= state.predictedLifespan){
    state.age = state.predictedLifespan;
    updateAgeDisplay();
    updateCharacterByAge();
    state.running = false;
    if(!state.dead) runDeathAnimation();
    return;
  }
  updateAgeDisplay();
  updateCharacterByAge();
  requestAnimationFrame(tick);
}

function start(){
  if(state.running) return;
  if(state.dead) {
    // If dead, reset first so animation looks clean
    doReset(false);
  }
  state.running = true;
  state.lastTick = null;
  requestAnimationFrame(tick);
}

function doReset(hard = true){
  state.running = false;
  state.age = 0;
  state.dead = false;
  character.style.opacity = '1';
  character.setAttribute('transform', 'translate(150, 230) scale(1)');
  posture.setAttribute('transform', 'rotate(0)');
  updateAgeDisplay();
  updateCharacterByAge();
  if(hard){
    // reset dials
    dialEls.forEach(d => {
      const key = d.dataset.key;
      factors[key].value = 0;
      updateDialVisual(d);
    });
    computePredictedLifespan();
  }
}

function attachControls(){
  goBtn.addEventListener('click', start);
  resetBtn.addEventListener('click', () => doReset(true));
}

// Init
setupDials();
attachControls();
updateCharacterByAge();
updateAgeDisplay();
