import { AudioListener } from './AudioListener';
import { BinChart } from './BinChart';
import { CanvasRenderer } from './CanvasRenderer';
import * as Convert from './Convert';
import { Ping } from './Ping';
import { ShineEffect } from './ShineEffect';
import { TuneChart } from './TuneChart';

window.addEventListener('DOMContentLoaded', () => {
	const RE_INTEGER = /^\d+$/;
	const RE_FLOAT = /^\d+(?:[.,]\d*)?$/;
	const MIDI_MIN = 0;
	const MIDI_MAX = 127;

	const CLASS_INPUT_ERROR = 'input-wrapper__error';
	const CLASS_INPUT_APPROX = 'input-wrapper--approx';
	const CLASS_BUTTON_ACTIVE = 'button--active';

	// TODO: add UI to set custom tuning
	const TUNING = 440.0;


	// resources

	ShineEffect.create('.fx-shiny');

	const tuneChart = CanvasRenderer.create(TuneChart, '#tune-chart', { color: '#000' });
	const binChart = CanvasRenderer.create(BinChart, '#bin-chart', { color: 'hsl(0,75%,63%)' });

	tuneChart.update(440.0);


	// manual conversion form

	const midiBox = document.getElementById('midi-box');
	const midiInput = document.getElementById('midi-input');
	const noteBox = document.getElementById('note-box');
	const noteInput = document.getElementById('note-input');
	const freqBox = document.getElementById('freq-box');
	const freqInput = document.getElementById('freq-input');

	let lastMidi = 69;
	let lastFreq = 440.0;

	midiInput.addEventListener('focus', onFocusMidiOrNote);
	midiInput.addEventListener('keydown', createIncrementDecrement(onIncrementMidi));
	midiInput.addEventListener('beforeinput', createInputValidation(onIntegerInput));
	midiInput.addEventListener('input', () => {
		try {
			const input = midiInput.value;
			if (!RE_INTEGER.test(input)) {
				throw new Error('invalid MIDI number');
			}

			const midi = checkMidiWithinRange(Number(input));
			const freq = Convert.midiToFrequency(midi, TUNING);

			clearErrors();
			lastMidi = midi;
			setNote(Convert.midiToNote(midi));
			setFrequency(freq);
		}
		catch (ex) {
			setError(midiBox, ex.message);
		}
	});

	noteInput.addEventListener('focus', onFocusMidiOrNote);
	noteInput.addEventListener('keydown', createIncrementDecrement(onIncrementMidi));
	noteInput.addEventListener('beforeinput', createInputValidation(onNoteInput));
	noteInput.addEventListener('input', () => {
		try {
			const note = noteInput.value;
			const midi = checkMidiWithinRange(Convert.noteToMidi(note));
			const freq = Convert.midiToFrequency(midi, TUNING);

			clearErrors();
			setMidi(midi);
			setFrequency(freq);
		}
		catch (ex) {
			setError(noteBox, ex.message);
		}
	});

	freqInput.addEventListener('focus', onFocusAny);
	freqInput.addEventListener('keydown', createIncrementDecrement(onIncrementFrequency));
	freqInput.addEventListener('beforeinput', createInputValidation(onFloatInput));
	freqInput.addEventListener('input', () => {
		try {
			const input = freqInput.value;
			if (!RE_FLOAT.test(input)) {
				throw new Error('invalid frequency value');
			}

			const freq = Number(input.replace(',', '.'));
			const midi = checkMidiWithinRange(Convert.frequencyToMidi(freq, TUNING));
			const isRounded = isMidiRounded(midi, freq);

			clearErrors();
			setMidi(midi, isRounded);
			setNote(Convert.midiToNote(midi), isRounded);
			lastFreq = freq;
			tuneChart.update(freq);
		}
		catch (ex) {
			setError(freqBox, ex.message);
		}
	});

	function onFocusMidiOrNote(e) {
		midiBox.classList.remove(CLASS_INPUT_APPROX);
		noteBox.classList.remove(CLASS_INPUT_APPROX);
		setFrequency(Convert.midiToFrequency(lastMidi, TUNING));
		onFocusAny(e);
	}

	function onFocusAny(e) {
		e.target.setSelectionRange(0, e.target.value.length);
	}

	function clearErrors(wrapper = document) {
		wrapper
			.querySelectorAll(`.${CLASS_INPUT_ERROR}`)
			.forEach(node => {
				node.parentNode.removeChild(node);
			});
	}

	function setError(wrapper, text) {
		clearErrors(wrapper);
		const node = document.createElement('span');
		node.classList.add(CLASS_INPUT_ERROR);
		node.textContent = text;
		wrapper.insertBefore(node, wrapper.firstChild);
	}

	function setMidi(midi, isRounded = false) {
		lastMidi = midi;
		midiInput.value = midi.toFixed(0);
		midiBox.classList.toggle(CLASS_INPUT_APPROX, isRounded);
	}

	function setNote(note, isRounded = false) {
		noteInput.value = note;
		noteBox.classList.toggle(CLASS_INPUT_APPROX, isRounded);
	}

	function setFrequency(freq, precision = 2) {
		lastFreq = freq;
		const str = freq.toFixed(precision);
		const match = /^(\d+)[.,]0*$/.exec(str);
		freqInput.value = match ? match[1] : str;
		tuneChart.update(freq);
	}

	function setInputsDisabled(disabled) {
		midiInput.disabled =
		noteInput.disabled =
		freqInput.disabled = disabled;
	}


	// input sanitization

	function createInputValidation(callback) {
		return e => {
			const input = e.target;
			const prev = input.value;
			const start = input.selectionStart ?? prev.length;
			const end = input.selectionEnd ?? prev.length;
			const next = prev.slice(0, start) + (e.data ?? '') + prev.slice(end);
			if (!callback(next)) {
				e.preventDefault();
			}
		};
	}

	function onIntegerInput(next) {
		return RE_INTEGER.test(next);
	}

	function onFloatInput(next) {
		return RE_FLOAT.test(next);
	}

	function onNoteInput(next) {
		return /^[A-Ga-g]#?\d*$/.test(next);
	}


	// increment/decrement functionality

	function createIncrementDecrement(callback) {
		return e => {
			switch (e.code) {
				case 'ArrowUp':
					e.preventDefault();
					callback(1);
					break;

				case 'ArrowDown':
					e.preventDefault();
					callback(-1);
					break;
			}
		};
	}

	function onIncrementMidi(offset) {
		const midi = clampMidi(lastMidi + offset);
		setMidi(midi);
		setNote(Convert.midiToNote(midi));
		setFrequency(Convert.midiToFrequency(midi, TUNING));
	}

	function onIncrementFrequency(offset) {
		const freq = clampFrequency(lastFreq + offset);
		const midi = Convert.frequencyToMidi(freq, TUNING);
		const isRounded = isMidiRounded(midi, freq);
		setMidi(midi, isRounded);
		setNote(Convert.midiToNote(midi), isRounded);
		setFrequency(freq);
	}


	// audio functions

	const recordButton = document.getElementById('record-button');
	recordButton.addEventListener('click', async () => {
		const listener = await getOrCreateListener();
		listener.toggleEnabled();

		setInputsDisabled(listener.isEnabled);
		recordButton.classList.toggle(CLASS_BUTTON_ACTIVE, listener.isEnabled);
		if (!listener.isEnabled) {
			binChart.clear();
		}
	});

	const pingButton = document.getElementById('ping-button');
	pingButton.addEventListener('pointerdown', () => {
		getOrCreatePing().on(lastFreq);
	});
	pingButton.addEventListener('pointerup', () => {
		getOrCreatePing().off();
	});

	const bins = new Array(16).fill(0.0);
	let audioContext;
	let audioPing;
	let audioListener;

	function getOrCreateAudioContext() {
		return (audioContext ??= new AudioContext());
	}

	function getOrCreatePing() {
		return (audioPing ??= Ping.create(getOrCreateAudioContext()));
	}

	async function getOrCreateListener() {
		return (audioListener ??= await AudioListener.create({
			context: getOrCreateAudioContext(),
			processor: 'listener',
			callbacks: {
				bin(bin) {
					bins.shift();
					bins.push(1.0 - (1.0 - bin) ** 5);
					binChart.update(bins);
				},
				pitch(freq) {
					const midi = Convert.frequencyToMidi(freq, TUNING);
					if (midi < MIDI_MIN || midi > MIDI_MAX) {
						return;
					}

					const isRounded = isMidiRounded(midi, freq);

					clearErrors();
					setMidi(midi, isRounded);
					setNote(Convert.midiToNote(midi), isRounded);
					setFrequency(freq, 0);
					tuneChart.update(freq);
				}
			}
		}));
	}

	// utils

	function checkMidiWithinRange(midi) {
		if (midi < MIDI_MIN) {
			throw new Error('value too low');
		}

		if (midi > MIDI_MAX) {
			throw new Error('value too high');
		}

		return midi;
	}

	function isMidiRounded(midi, freq) {
		const EPSILON = 0.1;
		return Math.abs(Convert.midiToFrequency(midi, TUNING) - freq) > EPSILON;
	}

	function clampMidi(midi) {
		return Math.min(Math.max(midi, MIDI_MIN), MIDI_MAX);
	}

	function clampFrequency(freq) {
		const freqMin = Convert.midiToFrequency(MIDI_MIN, TUNING);
		const freqMax = Convert.midiToFrequency(MIDI_MAX, TUNING);
		return Math.min(Math.max(freq, freqMin), freqMax);
	}
});
