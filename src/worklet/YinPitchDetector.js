// Implementation referenced from 'Yin' by Patrice Guyot (MIT license)
// https://github.com/patriceguyot/Yin
// see ~/licenses/yin.txt

export function createYinPitchDetector({ fMin, fMax, windowLength, windowOffset, threshold, onPitchAvailable }) {
	// Usually we won't need high-end sample rates as typically we only detect musical pitches within the MIDI range (i.e. up to ~12.5 kHz).
	// For example, event the arguably poor SR of 22.05 kHz should allow detection of E9 (i.e. MIDI 124), near the end of our assumed range.
	//
	// To save on computations, we can process only every n-th sample as a trivial down-sampling mechanism.

	// Nyquist
	const targetSampleRate = fMax * 2.0;

	// Find the closest integer divisor of the actual sampleRate that yields *at least* the target SR.
	const sampleRateDivisor = Math.trunc(sampleRate / targetSampleRate) - 1;
	const actualSampleRate = Math.trunc(sampleRate / sampleRateDivisor);

	// Calculate window in number of samples
	const wndSize = Math.trunc(windowLength * actualSampleRate);
	const wndOffset = Math.trunc(windowOffset * actualSampleRate);

	// Init buffers for the Yin algorithm
	const tauMin = Math.trunc(actualSampleRate / fMax);
	const tauMax = Math.trunc(actualSampleRate / fMin);

	const buffer = new Array(wndSize + wndOffset);
	const diff = new Array(tauMax);
	const mean = new Array(tauMax);

	const getPitch = () => {
		let tau;
		let iMax;
		let i;
		let delta;
		let sum = 0.0;

		// diff function (can be done faster with FFT convolution, but probably not worth it in JS & at low sample rates)
		for (tau = 1; tau < tauMax; ++tau) {
			diff[tau] = 0.0;
			iMax = wndSize - tau;
			for (i = 0; i < iMax; ++i) {
				delta = buffer[i] - buffer[i + tau];
				diff[tau] += delta * delta;
			}
		}

		// cumulative mean
		for (i = 1; i < tauMax; ++i) {
			sum += diff[i];
			mean[i] = diff[i] * i / sum;
		}

		mean[0] = 1.0;

		// get pitch
		for (tau = tauMin; tau < tauMax; ++tau) {
			if (mean[tau] < threshold) {
				while (tau + 1 < tauMax && mean[tau + 1] < mean[tau]) {
					++tau;
				}

				return actualSampleRate / tau;
			}
		}

		return 0;
	};

	// sample ingress
	let index = 0;
	let skip = 0;
	return sample => {
		if (++skip < sampleRateDivisor) {
			return;
		}

		buffer[index] = sample;
		skip = 0;

		if (++index >= wndSize + wndOffset) {
			buffer.copyWithin(0, wndOffset);
			index = wndSize;

			const pitch = getPitch();
			if (pitch > 0) {
				onPitchAvailable(pitch);
			}
		}
	};
}
