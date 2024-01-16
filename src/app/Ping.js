export class Ping {
	#ctx;
	#osc;
	#amp;

	constructor(ctx, osc, amp) {
		this.#ctx = ctx;
		this.#osc = osc;
		this.#amp = amp;
	}

	destroy() {
		this.#ctx?.close();
	}

	ping(freq) {
		this.on(freq);
		this.off();
	}

	on(freq) {
		const t = this.#ctx.currentTime;
		this.#osc.frequency.setValueAtTime(freq, t);
		this.#amp.gain.cancelScheduledValues(t);
		this.#amp.gain.setTargetAtTime(1.0, t, 0.001);
	}

	off() {
		const t = this.#ctx.currentTime;
		this.#amp.gain.setTargetAtTime(0.0, t + 0.1, 0.1);
	}

	static create(ctx) {
		const osc = ctx.createOscillator();
		const amp = ctx.createGain();
		amp.gain.value = 0.0;

		osc.connect(amp);
		amp.connect(ctx.destination);
		osc.start();

		return new Ping(ctx, osc, amp);
	}
}
