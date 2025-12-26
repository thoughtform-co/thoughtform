// ═══════════════════════════════════════════════════════════════════
// ODE INTEGRATORS FOR PARTICLE SYSTEMS
// Euler, RK2, RK4 for flow-field / attractor sampling
// ═══════════════════════════════════════════════════════════════════

import type { Vec3 } from "./math";

/**
 * A differential equation: given state, returns derivative
 */
export type ODE3 = (state: Vec3, time: number) => Vec3;

/**
 * Euler integration (1st order, fast but less accurate)
 */
export function eulerStep(ode: ODE3, state: Vec3, dt: number, time = 0): Vec3 {
  const d = ode(state, time);
  return {
    x: state.x + d.x * dt,
    y: state.y + d.y * dt,
    z: state.z + d.z * dt,
  };
}

/**
 * Midpoint method / RK2 (2nd order, better accuracy)
 */
export function rk2Step(ode: ODE3, state: Vec3, dt: number, time = 0): Vec3 {
  const k1 = ode(state, time);
  const midpoint: Vec3 = {
    x: state.x + k1.x * dt * 0.5,
    y: state.y + k1.y * dt * 0.5,
    z: state.z + k1.z * dt * 0.5,
  };
  const k2 = ode(midpoint, time + dt * 0.5);
  return {
    x: state.x + k2.x * dt,
    y: state.y + k2.y * dt,
    z: state.z + k2.z * dt,
  };
}

/**
 * Runge-Kutta 4 (4th order, high accuracy)
 */
export function rk4Step(ode: ODE3, state: Vec3, dt: number, time = 0): Vec3 {
  const k1 = ode(state, time);
  const s2: Vec3 = {
    x: state.x + k1.x * dt * 0.5,
    y: state.y + k1.y * dt * 0.5,
    z: state.z + k1.z * dt * 0.5,
  };
  const k2 = ode(s2, time + dt * 0.5);
  const s3: Vec3 = {
    x: state.x + k2.x * dt * 0.5,
    y: state.y + k2.y * dt * 0.5,
    z: state.z + k2.z * dt * 0.5,
  };
  const k3 = ode(s3, time + dt * 0.5);
  const s4: Vec3 = {
    x: state.x + k3.x * dt,
    y: state.y + k3.y * dt,
    z: state.z + k3.z * dt,
  };
  const k4 = ode(s4, time + dt);

  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: state.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

export type Integrator = typeof eulerStep | typeof rk2Step | typeof rk4Step;

/**
 * Generate a trajectory by integrating an ODE
 */
export function generateTrajectory(
  ode: ODE3,
  initial: Vec3,
  steps: number,
  dt: number,
  integrator: Integrator = eulerStep,
  warmup = 0
): Vec3[] {
  const points: Vec3[] = [];
  let state = { ...initial };
  let time = 0;

  // Warmup: advance without recording
  for (let i = 0; i < warmup; i++) {
    state = integrator(ode, state, dt, time);
    time += dt;
  }

  // Record trajectory
  for (let i = 0; i < steps; i++) {
    points.push({ ...state });
    state = integrator(ode, state, dt, time);
    time += dt;

    // Safety: bail if state explodes
    if (!isFinite(state.x) || !isFinite(state.y) || !isFinite(state.z)) {
      break;
    }
  }

  return points;
}

// ═══════════════════════════════════════════════════════════════════
// PREDEFINED FLOW FIELDS / ODEs
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a Lorenz attractor ODE
 */
export function lorenzODE(sigma = 10, rho = 28, beta = 8 / 3): ODE3 {
  return (state) => ({
    x: sigma * (state.y - state.x),
    y: state.x * (rho - state.z) - state.y,
    z: state.x * state.y - beta * state.z,
  });
}

/**
 * Create a Rössler attractor ODE
 */
export function rosslerODE(a = 0.2, b = 0.2, c = 5.7): ODE3 {
  return (state) => ({
    x: -(state.y + state.z),
    y: state.x + a * state.y,
    z: b + state.z * (state.x - c),
  });
}

/**
 * Create a Thomas attractor ODE
 */
export function thomasODE(b = 0.208186): ODE3 {
  return (state) => ({
    x: Math.sin(state.y) - b * state.x,
    y: Math.sin(state.z) - b * state.y,
    z: Math.sin(state.x) - b * state.z,
  });
}

/**
 * Create a Halvorsen attractor ODE
 */
export function halvorsenODE(a = 1.89): ODE3 {
  return (state) => ({
    x: -a * state.x - 4 * state.y - 4 * state.z - state.y * state.y,
    y: -a * state.y - 4 * state.z - 4 * state.x - state.z * state.z,
    z: -a * state.z - 4 * state.x - 4 * state.y - state.x * state.x,
  });
}

/**
 * Create an Aizawa attractor ODE
 */
export function aizawaODE(a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1): ODE3 {
  return (state) => {
    const x2y2 = state.x * state.x + state.y * state.y;
    return {
      x: (state.z - b) * state.x - d * state.y,
      y: d * state.x + (state.z - b) * state.y,
      z:
        c +
        a * state.z -
        (state.z * state.z * state.z) / 3 -
        x2y2 * (1 + e * state.z) +
        f * state.z * state.x * state.x * state.x,
    };
  };
}

/**
 * A generic curl noise / turbulent flow field
 * Creates organic, filamentary motion
 */
export function curlNoiseODE(frequency = 1, amplitude = 1, seed = 0): ODE3 {
  // Simple pseudo-noise based on sine combinations
  const s1 = seed * 0.1 + 1.3;
  const s2 = seed * 0.2 + 2.7;
  const s3 = seed * 0.3 + 4.1;

  return (state) => {
    const x = state.x * frequency;
    const y = state.y * frequency;
    const z = state.z * frequency;

    // Pseudo-potential field using trigonometric functions
    const px = Math.sin(y * s1 + z * s2) + Math.sin(z * s3 + x * s1) * 0.5;
    const py = Math.sin(z * s2 + x * s3) + Math.sin(x * s1 + y * s2) * 0.5;
    const pz = Math.sin(x * s3 + y * s1) + Math.sin(y * s2 + z * s3) * 0.5;

    // Curl of potential (approximation)
    return {
      x: (py - pz) * amplitude,
      y: (pz - px) * amplitude,
      z: (px - py) * amplitude,
    };
  };
}
