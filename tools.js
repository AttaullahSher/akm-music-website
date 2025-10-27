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
        
        if (window.gtag) {
            window.gtag('event', eventName, {
                ...params,
                timestamp: new Date().toISOString()
            });
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

    // Guitar Tuner Implementation
    async setupTuner() {
        const startButton = document.getElementById('startTuner');
        if (!startButton) return;

        startButton.addEventListener('click', async () => {
            if (this.microphone) {
                this.stopTuner();
                startButton.classList.remove('active');
                startButton.querySelector('.tuner-start-label').textContent = 'Start Tuner';
                this.trackEvent('stop_tuner');
            } else {
                await this.startTuner();
                startButton.classList.add('active');
                startButton.querySelector('.tuner-start-label').textContent = 'Stop Tuner';
                this.trackEvent('start_tuner');
            }
        });
    }

    async startTuner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: false, 
                    autoGainControl: false, 
                    noiseSuppression: false,
                    sampleRate: 44100
                } 
            });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 16384; // Increased for better low frequency detection
            this.analyser.smoothingTimeConstant = 0.4;
            this.microphone.connect(this.analyser);

            // Initialize compact LCD UI state
            const needle = document.getElementById('lcdNeedle');
            if (needle) needle.style.transform = 'translateX(-50%) rotate(0deg)';
            const noteEl = document.getElementById('noteDisplay');
            if (noteEl) noteEl.textContent = '♪';

            // Kick off loop
            this.updateTuner();
        } catch (error) {
            console.error('Microphone access error:', error);
            alert('⚠️ Microphone access required\n\nPlease allow microphone access to use the tuner.');
        }
    }

    stopTuner() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        const startButton = document.getElementById('startTuner');
        if (startButton) {
            startButton.classList.remove('active');
            const lbl = startButton.querySelector('.tuner-start-label');
            if (lbl) lbl.textContent = 'Start Tuner';
        }
        // Reset compact LCD
        const needle = document.getElementById('lcdNeedle');
        if (needle) needle.style.transform = 'translateX(-50%) rotate(0deg)';
        const noteEl = document.getElementById('noteDisplay');
        if (noteEl) noteEl.textContent = '--';
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
            const noteEl = document.getElementById('noteDisplay');
            if (noteEl) noteEl.textContent = noteName;
            // Pointer rotation, clamp (-20..+20) cents -> (-40..+40deg)
            let deg = Math.max(-40, Math.min(40, (cents / 20) * 40));
            const needle = document.getElementById('lcdNeedle');
            if (needle) needle.style.transform = `translateX(-50%) rotate(${deg}deg)`;
        }
        if (this.microphone) requestAnimationFrame(() => this.updateTuner());
    }

    autoCorrelate(buffer, sampleRate) {
        // Enhanced autocorrelation with better noise filtering
        let SIZE = buffer.length;
        let rms = 0;
        
        // Calculate RMS (signal strength)
        for (let i = 0; i < SIZE; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / SIZE);
        
        // Require stronger signal for better accuracy
        if (rms < 0.015) return -1; // Increased threshold
        
        // Find center of waveform
        let r1 = 0, r2 = SIZE - 1, thres = 0.15;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }
        
        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;
        
        if (SIZE < 100) return -1; // Buffer too small
        
        // Autocorrelation
        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buffer[j] * buffer[j + i];
            }
        }
        
        // Find first dip
        let d = 0;
        while (d < SIZE - 1 && c[d] > c[d + 1]) d++;
        
        // Find maximum after first dip
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        
        if (maxpos === -1 || maxval < 0.1) return -1;
        
        let T0 = maxpos;
        
        // Parabolic interpolation for sub-sample accuracy
        if (T0 > 0 && T0 < SIZE - 1) {
            let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
            let a = (x1 + x3 - 2 * x2) / 2;
            let b = (x3 - x1) / 2;
            if (a) T0 = T0 - b / (2 * a);
        }
        
        let frequency = sampleRate / T0;
        
        // Filter out unrealistic frequencies
        if (frequency < 40 || frequency > 2000) return -1;
        
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

    createToolsStyles() {
        if (document.getElementById('dynamic-tools-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dynamic-tools-styles';
        style.textContent = `
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
