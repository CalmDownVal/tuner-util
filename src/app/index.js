import { AudioListener } from './AudioListener';
import { BinChart } from './BinChart';
import { CanvasRenderer } from './CanvasRenderer';
import * as Convert from './Convert';
import { Ping } from './Ping';
import { ShineEffect } from './ShineEffect';
import { TuneChart } from './TuneChart';

window.addEventListener('DOMContentLoaded', () => {
	const RE_INTEGER = /^-?\d+$/;
	const RE_FLOAT = /^-?\d+(?:[.,]\d*)?$/;
	const MIDI_MIN = 21;
	const MIDI_MAX = 127;


	// resources

	ShineEffect.create('.fx-shiny');

	const tuneChart = CanvasRenderer.create(TuneChart, '#tune-chart', { color: '#000' });
	const binChart = CanvasRenderer.create(BinChart, '#bin-chart', { color: 'hsl(0,75%,63%)' });

	tuneChart.update(440.0);


	// manual conversion form

	const midiInput = document.getElementById('midi-input');
	const noteInput = document.getElementById('note-input');
	const freqInput = document.getElementById('freq-input');

	let lastMidi = 69;
	let lastNote = 'A4';
	let lastFreq = 440.0;

	// TODO: allow +/- 1 by up/down arrow keys
	// TODO: restrict allowed characters

	midiInput.addEventListener('focus', onSelectAllContent, false);
	midiInput.addEventListener('input', () => {
		try {
			const input = midiInput.value;
			if (!RE_INTEGER.test(input)) {
				throw new Error('invalid MIDI number');
			}

			const midi = clampMidi(Number(input));
			const freq = Convert.midiToFrequency(midi);

			clearErrors();
			lastMidi = midi;
			setNote(Convert.midiToNote(midi));
			setFrequency(freq);
			tuneChart.update(freq);
		}
		catch (ex) {
			setError(midiInput, ex.message);
		}
	});

	noteInput.addEventListener('focus', onSelectAllContent, false);
	noteInput.addEventListener('input', () => {
		try {
			const note = noteInput.value;
			const midi = clampMidi(Convert.noteToMidi(note));
			const freq = Convert.midiToFrequency(midi);
			lastFreq = freq;

			clearErrors();
			setMidi(midi);
			lastNote = note;
			setFrequency(freq);
			tuneChart.update(freq);
		}
		catch (ex) {
			setError(noteInput, ex.message);
		}
	});

	freqInput.addEventListener('focus', onSelectAllContent, false);
	freqInput.addEventListener('input', () => {
		try {
			const input = freqInput.value;
			if (!RE_FLOAT.test(input)) {
				throw new Error('invalid frequency value');
			}

			const freq = Number(input.replace(',', '.'));
			const midi = clampMidi(Convert.frequencyToMidi(freq));
			const isRounded = isMidiRounded(midi, freq);

			clearErrors();
			setMidi(midi, isRounded);
			setNote(Convert.midiToNote(midi), isRounded);
			lastFreq = freq;
			tuneChart.update(freq);
		}
		catch (ex) {
			setError(freqInput, ex.message);
		}
	});

	function onSelectAllContent() {
		this.setSelectionRange(0, this.value.length);
	}

	function clearErrors(parent = document) {
		parent
			.querySelectorAll('.input-wrapper__error')
			.forEach(node => {
				node.parentNode.removeChild(node);
			});
	}

	function setError(inputNode, text) {
		const parent = inputNode.parentNode;
		clearErrors(parent);
		const node = document.createElement('span');
		node.classList.add('input-wrapper__error');
		node.textContent = text;
		parent.insertBefore(node, parent.firstChild);
	}

	function clampMidi(midi) {
		const rounded = Math.round(midi);
		if (rounded < MIDI_MIN) {
			throw new Error('value too low');
		}

		if (rounded > MIDI_MAX) {
			throw new Error('value too high');
		}

		return rounded;
	}

	function setMidi(midi, isRounded = false) {
		lastMidi = midi;
		midiInput.value = (isRounded ? '~ ' : '') + midi.toFixed(0);
	}

	function setNote(note, isRounded = false) {
		lastNote = note;
		noteInput.value = (isRounded ? '~ ' : '') + note;
	}

	function setFrequency(freq, precision = 2) {
		lastFreq = freq;
		freqInput.value = freq.toFixed(precision);
	}

	function isMidiRounded(midi, freq) {
		return Math.abs(Convert.midiToFrequency(midi) - freq) > 0.1;
	}

	function setInputsDisabled(disabled) {
		midiInput.disabled =
		noteInput.disabled =
		freqInput.disabled = disabled;
	}


	// audio functions

	const recordButton = document.getElementById('record-button');
	recordButton.addEventListener('click', async () => {
		const listener = await getOrCreateListener();
		listener.setEnabled(!listener.isEnabled);
		setInputsDisabled(listener.isEnabled);
		recordButton.classList.toggle('button--active', listener.isEnabled);
		if (!listener.isEnabled) {
			binChart.clear();
		}
	});

	const pingButton = document.getElementById('ping-button');
	pingButton.addEventListener('click', () => {
		getOrCreatePing().emit(lastFreq);
	});

	const bins = new Array(16).fill(0.0);
	let audioContext;
	let audioPing;
	let audioListener;

	function getOrCreateAudioContext() {
		return audioContext ??= new AudioContext();
	}

	function getOrCreatePing() {
		return audioPing ??= Ping.create(getOrCreateAudioContext());
	}

	async function getOrCreateListener() {
		return audioListener ??= await AudioListener.create({
			context: getOrCreateAudioContext(),
			processor: 'listener',
			callbacks: {
				bin(bin) {
					bins.shift();
					bins.push(1.0 - (1.0 - bin) ** 5);
					binChart.update(bins);
				},
				pitch(freq) {
					const midi = Math.round(Convert.frequencyToMidi(freq));
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
		});
	}
});
