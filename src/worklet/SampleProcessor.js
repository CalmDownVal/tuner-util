/* eslint-disable max-classes-per-file */

export class SampleProcessor extends AudioWorkletProcessor {
	isEnabled = false;
	#callbacks;

	constructor(setup) {
		super();
		this.#callbacks = setup(this.port);

		this.port.start();
		this.port.addEventListener('message', e => {
			switch (e.data.kind) {
				case 'enable':
					this.isEnabled = e.data.value;
					break;
			}
		});
	}

	process(inputs, _outputs, _params) {
		if (!(this.isEnabled && inputs.length >= 1 && inputs[0].length >= 1)) {
			return true;
		}

		// We only expect mono signal.
		// AudioContext should downmix multi-channel audio source to mono for
		// us, however if we somehow get multiple streams, we ignore them and
		// only process the first one.
		const samples = inputs[0][0];
		const { length } = samples;

		let callback;
		let i;

		for (callback of this.#callbacks) {
			for (i = 0; i < length; ++i) {
				callback(samples[i]);
			}
		}

		return true;
	}

	static create(setup) {
		return class extends SampleProcessor {
			constructor() {
				super(setup);
			}
		};
	}
}
