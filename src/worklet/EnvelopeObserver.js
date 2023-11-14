export function createEnvelopeObserver({ binsPerSecond, onBinAvailable }) {
	const samplesPerBin = sampleRate / binsPerSecond;

	let currentBinMax = 0;
	let currentBinCount = 0;

	return sample => {
		if (++currentBinCount >= samplesPerBin) {
			onBinAvailable(currentBinMax);
			currentBinMax = 0;
			currentBinCount = 0;
		}

		currentBinMax = Math.max(currentBinMax, Math.abs(sample));
	};
}
