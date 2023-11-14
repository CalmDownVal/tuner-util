export class SampleProcessor extends AudioWorkletProcessor {
	#callbacks;
	#isEnabled = false;

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
		if (!(this.isEnabled && inputs.length === 1 && inputs[0].length === 1)) {
			return true;
		}

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
		}
	}
}
