const DEFAULT_TUNING = 440.0;
const RE_NOTE = /^([a-g]#?)(\d+)$/i;
const NOTE = {
	'a': 9,
	'A': 9,
	'a#': 10,
	'A#': 10,
	'b': 11,
	'B': 11,
	'c': 0,
	'C': 0,
	'c#': 1,
	'C#': 1,
	'd': 2,
	'D': 2,
	'd#': 3,
	'D#': 3,
	'e': 4,
	'E': 4,
	'f': 5,
	'F': 5,
	'f#': 6,
	'F#': 6,
	'g': 7,
	'G': 7,
	'g#': 8,
	'G#': 8
};

const ETON = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B'
];

export function noteToMidi(note) {
	const match = RE_NOTE.exec(note);
	if (!(match && Object.hasOwn(NOTE, match[1]))) {
		throw new Error('invalid note name');
	}

	return 12 + Math.trunc(Number(match[2]) * 12) + NOTE[match[1]];
}

export function frequencyToMidi(freq, tuning = DEFAULT_TUNING) {
	return Math.round(12.0 * Math.log(freq / tuning) / Math.LN2 + 69.0);
}

export function midiToNote(midi) {
	const safeMidi = Math.trunc(midi);
	return ETON[safeMidi % 12] + Math.floor(safeMidi / 12 - 1);
}

export function midiToFrequency(midi, tuning = DEFAULT_TUNING) {
	return Math.round(100.0 * 2.0 ** ((midi - 69) / 12.0) * tuning) / 100.0;
}
