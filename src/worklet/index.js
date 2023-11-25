import { createEnvelopeObserver } from './EnvelopeObserver';
import { SampleProcessor } from './SampleProcessor';
import { createYinPitchDetector } from './YinPitchDetector';

registerProcessor('listener', SampleProcessor.create(port => [
	createYinPitchDetector({
		// 50Hz ≈ MIDI 31 ... results in needed window size of ≥ 3920 at 196kHz sample rate
		fMin: 50,
		// 2500Hz ≈ MIDI 99
		fMax: 2500,
		windowSize: 4096,
		windowOffset: 1024,
		threshold: 0.3,
		onPitchAvailable(value) {
			port.postMessage({
				kind: 'pitch',
				value
			});
		}
	}),
	createEnvelopeObserver({
		binsPerSecond: 16,
		onBinAvailable(value) {
			port.postMessage({
				kind: 'bin',
				value
			});
		}
	})
]));
