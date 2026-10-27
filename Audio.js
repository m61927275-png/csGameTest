// ============================================
// CS2 Web Game - Procedural Audio Engine
// Web Audio API Gunfire, Explosions, Footsteps & Radio
// ============================================

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.7;
        this.lastFootstepTime = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer(duration = 0.5) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playShot(weapon) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const isSilenced = weapon.silenced;
        const isSniper = weapon.type === 'sniper';
        const isShotgun = weapon.type === 'shotgun';

        // 1. Transient Click / Snap
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = isSilenced ? 'sine' : 'triangle';
        const startFreq = isSniper ? 600 : (weapon.sound?.freq || 700);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + (isSilenced ? 0.05 : 0.12));

        oscGain.gain.setValueAtTime(isSilenced ? 0.4 : 0.8 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isSilenced ? 0.06 : 0.15));

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);

        // 2. Powder Explosion / Noise Blast
        const noiseBuf = this.createNoiseBuffer(isSilenced ? 0.08 : (isSniper ? 0.45 : 0.22));
        if (noiseBuf) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuf;

            const filter = this.ctx.createBiquadFilter();
            filter.type = isSilenced ? 'lowpass' : (isShotgun ? 'bandpass' : 'lowpass');
            filter.frequency.setValueAtTime(isSilenced ? 1200 : (isSniper ? 3500 : 2500), now);
            filter.frequency.exponentialRampToValueAtTime(isSilenced ? 300 : 200, now + 0.2);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(isSilenced ? 0.35 : (isSniper ? 1.0 : 0.7) * this.masterVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isSilenced ? 0.08 : 0.3));

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }

        // 3. Sub Punch (Bass thump)
        if (!isSilenced) {
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(isSniper ? 130 : 90, now);
            subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.18);

            subGain.gain.setValueAtTime(isSniper ? 0.9 : 0.5, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            subOsc.connect(subGain);
            subGain.connect(this.ctx.destination);
            subOsc.start(now);
            subOsc.stop(now + 0.2);
        }
    }

    playHeadshot() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Distinctive CS metallic helmet "DINK"
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2200, now);
        osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(3100, now);
        osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.2);

        gain.gain.setValueAtTime(0.7 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.26);
        osc2.stop(now + 0.26);
    }

    playHit() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Flesh hit thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

        gain.gain.setValueAtTime(0.5 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playKnife() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const noiseBuf = this.createNoiseBuffer(0.15);
        if (noiseBuf) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuf;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.Q.value = 3.0;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }
    }

    playReload() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Mag out click
        this.playMechanicalClick(now, 1200);
        // Mag in clack
        this.playMechanicalClick(now + 0.45, 900);
        // Slide pull clack
        this.playMechanicalClick(now + 0.9, 1400);
    }

    playMechanicalClick(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.05);

        gain.gain.setValueAtTime(0.35 * this.masterVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.07);
    }

    playExplosion() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Low boom
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.8);

        oscGain.gain.setValueAtTime(1.0 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);

        // Rumbling noise blast
        const noiseBuf = this.createNoiseBuffer(1.2);
        if (noiseBuf) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuf;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 1.2);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.9 * this.masterVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }
    }

    playFlashTinnitus(duration = 3.0) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Pop
        this.playMechanicalClick(now, 2400);

        // High pitched ringing
        const ring = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        ring.type = 'sine';
        ring.frequency.setValueAtTime(3800, now);

        gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        ring.connect(gain);
        gain.connect(this.ctx.destination);
        ring.start(now);
        ring.stop(now + duration + 0.1);
    }

    playSmokeHiss() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const noiseBuf = this.createNoiseBuffer(2.5);
        if (noiseBuf) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuf;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2200, now);
            filter.Q.value = 2.0;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }
    }

    playFootstep(surface = 'concrete') {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastFootstepTime < 0.28) return;
        this.lastFootstepTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const baseFreq = surface === 'sand' ? 140 : 200;
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 40, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.06);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playBombBeep(interval = 1.0) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playRadio(message) {
        if ('speechSynthesis' in window && !this.isMuted) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(message);
            utter.rate = 1.15;
            utter.pitch = 0.9;
            utter.volume = 0.8 * this.masterVolume;
            window.speechSynthesis.speak(utter);
        }
    }
}

