import { createEnvelopeObserver } from './EnvelopeObserver';
import { SampleProcessor } from './SampleProcessor';
import { createYinPitchDetector } from './YinPitchDetector';

registerProcessor('listener', SampleProcessor.create(port => [
	createYinPitchDetector({
		// detection frequency range
		// 50Hz ≈ MIDI 31
		fMin: 50,
		// 3000Hz ≈ MIDI 102
		fMax: 2500,

		// detection window, in seconds
		windowLength: 0.1,
		windowOffset: 0.025,

		// detection threshold, dimensionless
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
