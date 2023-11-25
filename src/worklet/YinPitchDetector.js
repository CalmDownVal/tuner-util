import FFT from 'fft.js';

export function createYinPitchDetector({ fMin, fMax, windowSize, windowOffset, threshold, onPitchAvailable }) {
	const tauMin = Math.trunc(sampleRate / fMax);
	const tauMax = Math.trunc(sampleRate / fMin);

	const fft = new FFT(4096);
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

		// x = np.array(x, np.float64)
		// w = x.size
		// x_cumsum = np.concatenate((np.array([0]), (x * x).cumsum()))
		// conv = fftconvolve(x, x[::-1])
		// tmp = x_cumsum[w:0:-1] + x_cumsum[w] - x_cumsum[:w] - 2 * conv[w - 1:]
		// return tmp[:tau_max + 1]

		// x = np.array(x, np.float64)
		// w = x.size
		// tau_max = min(tau_max, w)
		// x_cumsum = np.concatenate((np.array([0.]), (x * x).cumsum()))
		// size = w + tau_max
		// p2 = (size // 32).bit_length()
		// nice_numbers = (16, 18, 20, 24, 25, 27, 30, 32)
		// size_pad = min(x * 2 ** p2 for x in nice_numbers if x * 2 ** p2 >= size)
		// fc = np.fft.rfft(x, size_pad)
		// conv = np.fft.irfft(fc * fc.conjugate())[:tau_max]
		// return x_cumsum[w:w - tau_max:-1] + x_cumsum[w] - x_cumsum[:tau_max] - 2 * conv

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
