export class MicrophoneListener {
	isEnabled = false;
	#ctx;
	#worklet;

	constructor(ctx, worklet, callbacks) {
		this.#ctx = ctx;
		this.#worklet = worklet;

		worklet.port.start();
		worklet.port.addEventListener('message', e => {
			if (this.isEnabled) {
				callbacks[e.data.kind]?.(e.data.value);
			}
		});
	}

	toggleEnabled(value) {
		this.isEnabled = typeof value === 'boolean' ? value : !this.isEnabled;
		this.#worklet.port.postMessage({
			kind: 'enable',
			value: this.isEnabled
		});
	}

	destroy() {
		this.#ctx.close();
	}

	static async create({ context, processor, callbacks }) {
		await context.audioWorklet.addModule('worklet.min.js');
		const worklet = new AudioWorkletNode(context, processor, {
			channelCount: 1,
			channelCountMode: 'explicit',
			numberOfInputs: 1,
			numberOfOutputs: 0
		});

		const stream = await navigator.mediaDevices.getUserMedia({
			video: false,
			audio: {
				autoGainControl: false,
				echoCancellation: false,
				noiseSuppression: false
			}
		});

		const inputNode = context.createMediaStreamSource(stream);
		inputNode.connect(worklet);

		return new MicrophoneListener(context, worklet, callbacks);
	}
}
