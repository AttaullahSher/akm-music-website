// Advanced Music Tools JavaScript
class MusicTools {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.metronomeInterval = null;
        this.isMetronomeRunning = false;
        this.tapTimes = [];
        this.guitarFrequencies = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; // E2 A2 D3 G3 B3 E4
        this.guitarNotes = ['E2','A2','D3','G3','B3','E4'];
        this.tunerMode = 'guitar'; // guitar-only automatic tuner
        this.lastTunerClick = 0; // Prevent duplicate clicks
        this.init();
    }

    // Debounced analytics tracking
    trackEvent(eventName, params = {}) {
        const now = Date.now();
        if (now - this.lastTunerClick < 300) return; // Debounce 300ms
        this.lastTunerClick = now;

        try {
            if (window.gtag) {
                window.gtag('event', eventName, {
                    ...params,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.warn('Analytics tracking error:', error);
        }
    }

    init() {
        this.setupTuner();
        this.setupMetronome();
        this.setupChordChart();
        this.setupScaleFinder();
        this.setupCircleOfFifths();
        this.createToolsStyles();
    }

    // Enhanced Guitar Tuner Implementation - iPhone Optimized
    async setupTuner() {
        const startButton = document.getElementById('startTuner');
        if (!startButton) return;

        // iPhone-specific handling
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.audioContextUnlocked = false;

        startButton.addEventListener('click', async (e) => {
            e.preventDefault();

            if (this.microphone) {
                this.stopTuner();
                startButton.classList.remove('active');
                startButton.querySelector('.tuner-start-label').textContent = '🎸 Start Tuner';
                this.updateTunerStatus('Tap to start tuning', 'ready');
                this.trackEvent('stop_tuner');
            } else {
                try {
                    await this.startTuner();
                    startButton.classList.add('active');
                    startButton.querySelector('.tuner-start-label').textContent = '⏹️ Stop Tuner';
                    this.updateTunerStatus('🎵 Listening... Play a note', 'listening');
                    this.trackEvent('start_tuner');
                } catch (error) {
                    console.error('Tuner start error:', error);
                    this.showTunerError('Unable to access microphone. Please check permissions and try again.');
                }
            }
        });

        // Add visual feedback for iOS
        if (this.isIOS) {
            this.addIOSAudioHint();
        }
    }

    async startTuner() {
        try {
            // iOS-specific audio context handling
            if (this.isIOS && !this.audioContextUnlocked) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // Unlock audio context on iOS
                const unlock = async () => {
                    await this.audioContext.resume();
                    this.audioContextUnlocked = true;
                    document.removeEventListener('touchstart', unlock);
                    document.removeEventListener('touchend', unlock);
                };
                document.addEventListener('touchstart', unlock, { once: true });
                document.addEventListener('touchend', unlock, { once: true });
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false,
                    sampleRate: this.isIOS ? 48000 : 44100, // Higher sample rate for iOS
                    channelCount: 1,
                    volume: 1.0
                }
            });

            if (!this.audioContext || this.audioContext.state === 'closed') {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.isIOS ? 8192 : 16384; // Smaller FFT for iOS performance
            this.analyser.smoothingTimeConstant = this.isIOS ? 0.3 : 0.4; // Faster response on iOS
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;

            this.microphone.connect(this.analyser);

            // Initialize enhanced UI state
            this.resetTunerDisplay();
            this.updateTunerStatus('🎵 Listening... Play a note', 'listening');

            // Start the tuning loop
            this.updateTuner();

        } catch (error) {
            console.error('Microphone access error:', error);
            let errorMessage = 'Unable to access microphone. ';

            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow microphone access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No microphone found. Please check your audio devices.';
            } else if (this.isIOS) {
                errorMessage += 'On iOS, you may need to unlock audio by tapping the screen first.';
            } else {
                errorMessage += 'Please check your browser permissions and try again.';
            }

            this.showTunerError(errorMessage);
            throw error;
        }
    }

    stopTuner() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        // Don't close audio context on iOS - keep it unlocked
        if (this.audioContext && !this.isIOS) {
            this.audioContext.close();
            this.audioContext = null;
        }

        const startButton = document.getElementById('startTuner');
        if (startButton) {
            startButton.classList.remove('active');
            const lbl = startButton.querySelector('.tuner-start-label');
            if (lbl) lbl.textContent = '🎸 Start Tuner';
        }

        // Reset enhanced display
        this.resetTunerDisplay();
        this.updateTunerStatus('Tap to start tuning', 'ready');
    }

    updateTuner() {
        if (!this.analyser) return;

        const bufferLength = this.analyser.fftSize;
        const buffer = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(buffer);

        const frequency = this.autoCorrelate(buffer, this.audioContext.sampleRate);

        if (frequency > 40 && frequency < 2000) {
            const note = this.frequencyToNote(frequency);
            const cents = this.getCents(frequency, note.frequency);
            const noteName = note.name.replace(/[0-9]/g, '');
            const octave = note.name.match(/\d+/)[0];

            // Update display with enhanced information
            this.updateTunerDisplay(noteName, octave, cents, frequency);

            // Visual feedback for tuning accuracy
            this.updateTuningAccuracy(cents);
        } else {
            // No valid frequency detected
            this.updateTunerDisplay('--', '', 0, 0);
            this.updateTuningAccuracy(null);
        }

        if (this.microphone) {
            // Use setTimeout for more consistent timing on mobile
            setTimeout(() => this.updateTuner(), this.isIOS ? 50 : 16); // ~20fps on iOS, ~60fps on desktop
        }
    }

    autoCorrelate(buffer, sampleRate) {
        // Enhanced autocorrelation with better noise filtering and mobile optimization
        let SIZE = buffer.length;
        let rms = 0;

        // Calculate RMS (signal strength) - adjusted for mobile sensitivity
        for (let i = 0; i < SIZE; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / SIZE);

        // Dynamic threshold based on device
        const threshold = this.isIOS ? 0.01 : 0.015; // More sensitive on iOS
        if (rms < threshold) return -1;

        // Find center of waveform with improved edge detection
        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;

        if (SIZE < (this.isIOS ? 50 : 100)) return -1; // Smaller buffer for iOS

        // Autocorrelation with optimized loop for mobile
        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buffer[j] * buffer[j + i];
            }
        }

        // Find first dip with better noise tolerance
        let d = 0;
        while (d < SIZE - 1 && c[d] > c[d + 1]) d++;
        if (d === 0) d = 1; // Ensure we don't start at 0

        // Find maximum after first dip with confidence check
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        if (maxpos === -1 || maxval < (this.isIOS ? 0.05 : 0.1)) return -1;

        let T0 = maxpos;

        // Parabolic interpolation for sub-sample accuracy
        if (T0 > 0 && T0 < SIZE - 1) {
            let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
            let a = (x1 + x3 - 2 * x2) / 2;
            let b = (x3 - x1) / 2;
            if (a) T0 = T0 - b / (2 * a);
        }

        let frequency = sampleRate / T0;

        // Filter out unrealistic frequencies with guitar-specific range
        if (frequency < 70 || frequency > 1200) return -1; // Guitar range: E2 (82Hz) to E6 (1318Hz)

        return frequency;
    }

    frequencyToNote(frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const h = Math.round(12 * Math.log2(frequency / C0));
        const octave = Math.floor(h / 12);
        const noteIndex = h % 12;
        
        return {
            name: noteNames[noteIndex] + octave,
            frequency: C0 * Math.pow(2, h / 12)
        };
    }

    getCents(frequency, targetFreq) {
        return Math.round(1200 * Math.log2(frequency / targetFreq));
    }

    // Metronome Implementation
    setupMetronome() {
        const playButton = document.getElementById('playMetronome');
        const bpmSlider = document.getElementById('bpmSlider');
        const bpmValue = document.getElementById('bpmValue');
        const tapButton = document.getElementById('tapTempo');

        if (!playButton) return;

        bpmSlider.addEventListener('input', (e) => {
            const bpm = e.target.value;
            bpmValue.textContent = bpm;
            if (this.isMetronomeRunning) {
                this.stopMetronome();
                this.startMetronome(bpm);
            }
        });

        playButton.addEventListener('click', () => {
            if (this.isMetronomeRunning) {
                this.stopMetronome();
            } else {
                this.startMetronome(bpmSlider.value);
            }
        });

        tapButton.addEventListener('click', () => {
            this.tapTempo();
        });

        // String buttons for tuner
        document.querySelectorAll('.string-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const freq = parseFloat(btn.dataset.freq);
                this.playTone(freq, 1000);
            });
        });
    }

    startMetronome(bpm) {
        const interval = 60000 / bpm; // ms per beat
        this.isMetronomeRunning = true;
        
        const playButton = document.getElementById('playMetronome');
        playButton.innerHTML = '<i class="fas fa-pause"></i> Stop';
        
        this.metronomeInterval = setInterval(() => {
            this.playClick();
            this.animateBeat();
        }, interval);
    }

    stopMetronome() {
        this.isMetronomeRunning = false;
        clearInterval(this.metronomeInterval);
        
        const playButton = document.getElementById('playMetronome');
        playButton.innerHTML = '<i class="fas fa-play"></i> Start';
    }

    playClick() {
        // Create realistic mechanical metronome click sound
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create two oscillators for a more mechanical sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const masterGain = ctx.createGain();
        
        // Connect audio graph
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        masterGain.connect(ctx.destination);
        
        // High frequency click (wood sound)
        osc1.frequency.setValueAtTime(2000, ctx.currentTime);
        osc1.type = 'square';
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        
        // Lower frequency thump (mechanical sound)
        osc2.frequency.setValueAtTime(100, ctx.currentTime);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        
        // Master volume
        masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
        
        // Start and stop
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.03);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.05);
        
        // Clean up context after sound finishes
        setTimeout(() => ctx.close(), 100);
    }

    playTone(frequency, duration) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);
    }

    animateBeat() {
        const visual = document.getElementById('metronomeVisual');
        if (visual) {
            visual.classList.add('beat-active');
            setTimeout(() => {
                visual.classList.remove('beat-active');
            }, 100);
        }
    }

    tapTempo() {
        const now = Date.now();
        this.tapTimes.push(now);
        
        // Keep only last 4 taps
        if (this.tapTimes.length > 4) {
            this.tapTimes.shift();
        }
        
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const bpm = Math.round(60000 / avgInterval);
            
            if (bpm >= 60 && bpm <= 200) {
                document.getElementById('bpmSlider').value = bpm;
                document.getElementById('bpmValue').textContent = bpm;
            }
        }
        
        // Clear taps after 3 seconds
        setTimeout(() => {
            this.tapTimes = [];
        }, 3000);
    }

    // Chord Chart Implementation
    setupChordChart() {
        const chordRoot = document.getElementById('chordRoot');
        const chordType = document.getElementById('chordType');
        
        if (!chordRoot || !chordType) return;
        
        const updateChord = () => {
            const root = chordRoot.value;
            const type = chordType.value;
            this.displayChord(root, type);
        };
        
        chordRoot.addEventListener('change', updateChord);
        chordType.addEventListener('change', updateChord);
        
        // Initial display
        updateChord();
    }

    displayChord(root, type) {
        const chordFormulas = {
            'major': [0, 4, 7],
            'minor': [0, 3, 7],
            '7': [0, 4, 7, 10],
            'm7': [0, 3, 7, 10],
            'maj7': [0, 4, 7, 11],
            'dim': [0, 3, 6],
            'aug': [0, 4, 8],
            'sus2': [0, 2, 7],
            'sus4': [0, 5, 7]
        };
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = noteNames.indexOf(root);
        const formula = chordFormulas[type] || [0, 4, 7];
        
        const chordNotes = formula.map(interval => {
            return noteNames[(rootIndex + interval) % 12];
        });
        
        this.renderGuitarFretboard(chordNotes);
        this.renderPianoKeyboard(chordNotes);
    }

    renderGuitarFretboard(chordNotes) {
        const fretboard = document.getElementById('guitarFretboard');
        if (!fretboard) return;
        
        // Simple guitar chord display (this would be more complex in a full implementation)
        fretboard.innerHTML = `
            <div class="chord-info">
                <h4>${chordNotes.join(' - ')}</h4>
                <p>Guitar fingering patterns would be displayed here</p>
            </div>
        `;
    }

    renderPianoKeyboard(chordNotes) {
        const keyboard = document.getElementById('pianoKeyboard');
        if (!keyboard) return;
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let keyboardHTML = '<div class="piano-keys">';
        
        noteNames.forEach(note => {
            const isActive = chordNotes.includes(note);
            const isBlack = note.includes('#');
            keyboardHTML += `
                <div class="piano-key ${isBlack ? 'black' : 'white'} ${isActive ? 'active' : ''}" 
                     data-note="${note}">
                    ${!isBlack ? note : ''}
                </div>
            `;
        });
        
        keyboardHTML += '</div>';
        keyboard.innerHTML = keyboardHTML;
    }

    // Scale Finder Implementation
    setupScaleFinder() {
        const scaleRoot = document.getElementById('scaleRoot');
        const scaleType = document.getElementById('scaleType');
        
        if (!scaleRoot || !scaleType) return;
        
        const updateScale = () => {
            const root = scaleRoot.value;
            const type = scaleType.value;
            this.displayScale(root, type);
        };
        
        scaleRoot.addEventListener('change', updateScale);
        scaleType.addEventListener('change', updateScale);
        
        // Initial display
        updateScale();
    }

    displayScale(root, type) {
        const scaleFormulas = {
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'phrygian': [0, 1, 3, 5, 7, 8, 10],
            'lydian': [0, 2, 4, 6, 7, 9, 11],
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'locrian': [0, 1, 3, 5, 6, 8, 10],
            'harmonic': [0, 2, 3, 5, 7, 8, 11],
            'melodic': [0, 2, 3, 5, 7, 9, 11],
            'pentatonic': [0, 2, 4, 7, 9],
            'blues': [0, 3, 5, 6, 7, 10]
        };
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = noteNames.indexOf(root);
        const formula = scaleFormulas[type] || [0, 2, 4, 5, 7, 9, 11];
        
        const scaleNotes = formula.map(interval => {
            return noteNames[(rootIndex + interval) % 12];
        });
        
        const notesContainer = document.getElementById('scaleNotes');
        const patternContainer = document.getElementById('scalePattern');
        
        if (notesContainer) {
            notesContainer.innerHTML = `
                <div class="scale-notes-display">
                    <h4>${root} ${type} Scale</h4>
                    <div class="notes">${scaleNotes.join(' - ')}</div>
                </div>
            `;
        }
        
        if (patternContainer) {
            const pattern = formula.slice(1).map((interval, i) => {
                const prevInterval = i === 0 ? 0 : formula[i];
                return interval - prevInterval;
            });
            
            patternContainer.innerHTML = `
                <div class="scale-pattern-display">
                    <h4>Interval Pattern</h4>
                    <div class="pattern">${pattern.join(' - ')}</div>
                </div>
            `;
        }
    }

    // Circle of Fifths Implementation
    setupCircleOfFifths() {
        const svg = document.getElementById('circleOfFifths');
        if (!svg) return;

        this.renderCircleOfFifths(svg);
    }

    renderCircleOfFifths(svg) {
        const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
        const centerX = 150;
        const centerY = 150;
        const radius = 100;

        // Ensure scalable viewport and clear previous content
        svg.setAttribute('viewBox', '0 0 300 300');
        svg.innerHTML = '';
        
        let svgContent = '';
        
        keys.forEach((key, index) => {
            const angle = (index * 30 - 90) * Math.PI / 180;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            svgContent += `
                <g transform="translate(${x}, ${y})">
                    <circle cx="0" cy="0" r="20" fill="rgba(255,255,255,0.1)" 
                            stroke="rgba(255,255,255,0.3)" stroke-width="2" 
                            class="circle-key" data-key="${key}"></circle>
                    <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" 
                          fill="white" font-family="Inter" font-weight="700" font-size="12" 
                          style="pointer-events:none;">${key}</text>
                </g>
            `;
        });
        
        svg.innerHTML = svgContent;
        
        // Add click handlers (on circles only)
        svg.querySelectorAll('.circle-key').forEach(circle => {
            circle.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.showKeyInfo(key);
            });
        });
    }

    showKeyInfo(key) {
        const info = document.getElementById('circleInfo');
        if (!info) return;

        const keySignatures = {
            'C': { sharps: 0, flats: 0, relative: 'Am' },
            'G': { sharps: 1, flats: 0, relative: 'Em' },
            'D': { sharps: 2, flats: 0, relative: 'Bm' },
            'A': { sharps: 3, flats: 0, relative: 'F#m' },
            'E': { sharps: 4, flats: 0, relative: 'C#m' },
            'B': { sharps: 5, flats: 0, relative: 'G#m' },
            'F#': { sharps: 6, flats: 0, relative: 'D#m' },
            'F': { sharps: 0, flats: 1, relative: 'Dm' },
            'Bb': { sharps: 0, flats: 2, relative: 'Gm' },
            'Eb': { sharps: 0, flats: 3, relative: 'Cm' },
            'Ab': { sharps: 0, flats: 4, relative: 'Fm' },
            'Db': { sharps: 0, flats: 5, relative: 'Bbm' },
            'Gb': { sharps: 0, flats: 6, relative: 'Ebm' }
        };

        const keyInfo = keySignatures[key] || { sharps: 0, flats: 0, relative: 'Unknown' };

        info.innerHTML = `
            <h4>${key} Major</h4>
            <p><strong>Relative Minor:</strong> ${keyInfo.relative}</p>
            <p><strong>Sharps:</strong> ${keyInfo.sharps}</p>
            <p><strong>Flats:</strong> ${keyInfo.flats}</p>
        `;
    }

    // Enhanced UI helper methods
    resetTunerDisplay() {
        const needle = document.getElementById('lcdNeedle');
        const noteEl = document.getElementById('noteDisplay');
        const octaveEl = document.getElementById('octaveDisplay');
        const centsEl = document.getElementById('centsDisplay');
        const freqEl = document.getElementById('frequencyDisplay');

        if (needle) needle.style.transform = 'translateX(-50%) rotate(0deg)';
        if (noteEl) noteEl.textContent = '--';
        if (octaveEl) octaveEl.textContent = '';
        if (centsEl) centsEl.textContent = '';
        if (freqEl) freqEl.textContent = '';
    }

    updateTunerDisplay(note, octave, cents, frequency) {
        const noteEl = document.getElementById('noteDisplay');
        const octaveEl = document.getElementById('octaveDisplay');
        const centsEl = document.getElementById('centsDisplay');
        const freqEl = document.getElementById('frequencyDisplay');

        if (noteEl) noteEl.textContent = note;
        if (octaveEl) octaveEl.textContent = octave;
        if (centsEl) centsEl.textContent = cents !== 0 ? `${cents > 0 ? '+' : ''}${cents}` : '';
        if (freqEl) freqEl.textContent = frequency > 0 ? `${frequency.toFixed(1)} Hz` : '';
    }

    updateTuningAccuracy(cents) {
        const accuracyEl = document.getElementById('tuningAccuracy');
        const needle = document.getElementById('lcdNeedle');

        if (!accuracyEl || !needle) return;

        if (cents === null) {
            accuracyEl.textContent = '';
            accuracyEl.className = 'tuning-accuracy';
            needle.style.transform = 'translateX(-50%) rotate(0deg)';
            return;
        }

        // Enhanced needle movement with smooth animation
        let deg = Math.max(-50, Math.min(50, (cents / 50) * 50)); // -50 to +50 degrees
        needle.style.transform = `translateX(-50%) rotate(${deg}deg)`;

        // Color-coded accuracy feedback
        accuracyEl.classList.remove('tuning-flat', 'tuning-sharp', 'tuning-good');

        if (Math.abs(cents) <= 5) {
            accuracyEl.textContent = '🎯 PERFECT!';
            accuracyEl.classList.add('tuning-good');
        } else if (cents < -5) {
            accuracyEl.textContent = '⬅️ TOO LOW';
            accuracyEl.classList.add('tuning-flat');
        } else if (cents > 5) {
            accuracyEl.textContent = 'TOO HIGH ➡️';
            accuracyEl.classList.add('tuning-sharp');
        }
    }

    updateTunerStatus(message, status) {
        const statusEl = document.getElementById('tunerStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `tuner-status status-${status}`;
        }
    }

    showTunerError(message) {
        this.updateTunerStatus(`❌ ${message}`, 'error');
        const startButton = document.getElementById('startTuner');
        if (startButton) {
            startButton.classList.remove('active');
            const lbl = startButton.querySelector('.tuner-start-label');
            if (lbl) lbl.textContent = '🎸 Start Tuner';
        }
    }

    addIOSAudioHint() {
        const hint = document.createElement('div');
        hint.id = 'ios-audio-hint';
        hint.innerHTML = `
            <div style="background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 8px; font-size: 14px; text-align: center; margin: 10px 0;">
                📱 <strong>iOS Tip:</strong> Tap anywhere on the screen to unlock audio before starting the tuner.
            </div>
        `;
        const tunerSection = document.querySelector('.tuner-section') || document.body;
        tunerSection.insertBefore(hint, tunerSection.firstChild);
    }

    createToolsStyles() {
        if (document.getElementById('dynamic-tools-styles')) return;

        const style = document.createElement('style');
        style.id = 'dynamic-tools-styles';
        style.textContent = `
            /* Enhanced Tuner Styles */
            .tuner-display {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                border: 2px solid rgba(255,255,255,0.1);
            }

            .tuner-main-display {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                position: relative;
            }

            .note-display-large {
                font-size: 4rem;
                font-weight: 700;
                color: #fff;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                min-width: 120px;
                text-align: center;
            }

            .octave-display {
                font-size: 1.5rem;
                color: rgba(255,255,255,0.7);
                margin-left: 10px;
            }

            .tuner-gauge {
                position: relative;
                width: 200px;
                height: 100px;
                margin: 0 20px;
            }

            .gauge-background {
                position: absolute;
                width: 100%;
                height: 100%;
                background: conic-gradient(
                    from -90deg,
                    #ff4757 0deg,
                    #ffa502 30deg,
                    #2ed573 60deg,
                    #ffa502 120deg,
                    #ff4757 150deg,
                    #2f3542 180deg
                );
                border-radius: 100px 100px 0 0;
                opacity: 0.3;
            }

            .gauge-needle {
                position: absolute;
                bottom: 10px;
                left: 50%;
                width: 2px;
                height: 80px;
                background: #fff;
                transform-origin: bottom center;
                transition: transform 0.1s ease-out;
                box-shadow: 0 0 10px rgba(255,255,255,0.5);
            }

            .tuner-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                font-size: 0.9rem;
            }

            .frequency-display, .cents-display {
                color: rgba(255,255,255,0.8);
                font-family: 'Courier New', monospace;
            }

            .tuning-accuracy {
                text-align: center;
                font-weight: 600;
                padding: 8px;
                border-radius: 8px;
                transition: all 0.3s ease;
                font-size: 1.1rem;
            }

            .tuning-good {
                background: linear-gradient(45deg, #2ed573, #26de81);
                color: white;
                animation: pulse 0.5s ease-in-out;
            }

            .tuning-flat {
                background: linear-gradient(45deg, #ff4757, #ff3838);
                color: white;
            }

            .tuning-sharp {
                background: linear-gradient(45deg, #ffa502, #ff9f43);
                color: white;
            }

            .tuner-status {
                text-align: center;
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .status-ready {
                background: rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.8);
            }

            .status-listening {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
            }

            .status-error {
                background: linear-gradient(45deg, #ff4757, #ff3838);
                color: white;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .tuner-display {
                    padding: 15px;
                    margin: 15px 0;
                }

                .note-display-large {
                    font-size: 3rem;
                }

                .tuner-gauge {
                    width: 150px;
                    height: 75px;
                }

                .gauge-needle {
                    height: 60px;
                }
            }

            /* iOS specific styles */
            @supports (-webkit-touch-callout: none) {
                .tuner-display {
                    -webkit-user-select: none;
                    user-select: none;
                }
            }

            .beat-active {
                transform: scale(1.2) !important;
                background: #43e97b !important;
            }

            .piano-keys {
                display: flex;
                gap: 2px;
                justify-content: center;
                margin: 1rem 0;
            }

            .piano-key {
                width: 30px;
                height: 80px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding: 5px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.8rem;
                font-weight: 600;
            }

            .piano-key.white {
                background: white;
                color: #333;
                border: 1px solid #ccc;
            }

            .piano-key.black {
                background: #333;
                color: white;
                height: 50px;
                width: 20px;
                margin: 0 -10px;
                z-index: 2;
            }

            .piano-key.active {
                background: #667eea !important;
                color: white !important;
            }

            .circle-key {
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .circle-key:hover {
                fill: rgba(255,255,255,0.2) !important;
            }

            .excel-headers-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .header-group {
                background: rgba(255,255,255,0.05);
                padding: 1rem;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }

            .header-group h4 {
                margin: 0 0 0.5rem 0;
                color: #667eea;
                font-size: 1rem;
                font-weight: 600;
            }

            .header-options {
                color: white;
                opacity: 0.9;
                font-family: 'Inter', sans-serif;
                font-size: 0.9rem;
                line-height: 1.4;
            }
        `;

        document.head.appendChild(style);
    }
}

// BPM Calculator
function calculateBPM() {
    const songLength = document.getElementById('songLength').value;
    const numBeats = parseInt(document.getElementById('numBeats').value);
    const result = document.getElementById('bpmResult');
    
    if (!songLength || !numBeats) {
        result.innerHTML = '<p style="color: #f5576c;">Please enter both song length and number of beats</p>';
        return;
    }
    
    // Parse song length (mm:ss)
    const [minutes, seconds] = songLength.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
        result.innerHTML = '<p style="color: #f5576c;">Invalid song length format. Use mm:ss</p>';
        return;
    }
    
    const totalSeconds = minutes * 60 + seconds;
    const bpm = Math.round((numBeats / totalSeconds) * 60);
    
    result.innerHTML = `
        <div style="color: #43e97b; font-size: 1.2rem; font-weight: 600;">
            BPM: ${bpm}
        </div>
        <p style="color: white; opacity: 0.8; margin-top: 0.5rem;">
            ${numBeats} beats in ${songLength} = ${bpm} BPM
        </p>
    `;
}

// Initialize tools when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    new MusicTools();
    
    // Make calculateBPM globally available
    window.calculateBPM = calculateBPM;

    const startBtn = document.getElementById('startTuner');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            try { 
                if (window.trackEvent) {
                    window.trackEvent('button_click', { buttonText: 'Start Guitar Tuner', buttonClass: startBtn.className });
                }
            } catch(e) {}
        });
    }
});
