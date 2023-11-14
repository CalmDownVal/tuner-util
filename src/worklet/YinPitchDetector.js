export function createYinPitchDetector({ fMin, fMax, windowSize, windowOffset, threshold, onPitchAvailable }) {
	const tauMin = Math.trunc(sampleRate / fMax);
	const tauMax = Math.trunc(sampleRate / fMin);

	const buffer = new Float32Array(windowSize + windowOffset);
	const diff = new Float32Array(tauMax);
	const mean = new Float32Array(tauMax);

	const getPitch = () => {
		let tau;
		let iMax;
		let i;
		let delta;
		let sum = 0.0;

		// diff function
		for (tau = 1; tau < tauMax; ++tau) {
			diff[tau] = 0.0;
			iMax = windowSize - tau;
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

				return sampleRate / tau;
			}
		}

		return 0;
	};

	let index = 0;
	return sample => {
		buffer[index] = sample;
		if (++index >= windowSize + windowOffset) {
			buffer.copyWithin(0, windowOffset);
			index = windowSize;

			console.time('yin');
			const pitch = getPitch();
			console.timeEnd('yin');

			if (pitch > 0) {
				onPitchAvailable(pitch);
			}
		}
	};
}
