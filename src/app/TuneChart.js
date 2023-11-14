import { CanvasRenderer } from './CanvasRenderer';
import * as Convert from './Convert';

export class TuneChart extends CanvasRenderer {
	#current = 0;
	#target = 0;

	update(freq, tuning) {
		const midi = Math.round(Convert.frequencyToMidi(freq, tuning));
		const nearest = Convert.midiToFrequency(midi, tuning);

		this.#target = (freq - nearest) / (
			freq < nearest
				? nearest - Convert.midiToFrequency(midi - 1, tuning)
				: Convert.midiToFrequency(midi + 1, tuning) - nearest
			);

		this.scheduleFrame();
	}

	render(ctx) {
		const padding = 4.0 * devicePixelRatio;
		const line = 1.0 * devicePixelRatio;
		const r2 = 6.0 * devicePixelRatio;
		const r3 = 4.0 * devicePixelRatio;

		ctx.lineWidth = 1.0 * devicePixelRatio;
		ctx.strokeStyle =
		ctx.fillStyle = this.options.color;

		const p1 = [ padding, this.height ];
		const p2 = [ this.width / 2, r2 + line + padding ];
		const p3 = [ this.width - padding, this.height ];
		const center = getCenter(p1, p2, p3);
		const r1 = center[1] - p2[1];
		const alpha = Math.asin(1.0 - (this.height - p2[1]) / r1);

		ctx.beginPath();
		ctx.arc(center[0], center[1], r1, Math.PI - alpha, alpha, false);
		ctx.stroke();

		ctx.clearRect(center[0] - r2, center[1] - r1 - r2, 2.0 * r2, 2.0 * r2);

		ctx.beginPath();
		ctx.arc(center[0], center[1] - r1, r2, 0, 2.0 * Math.PI, false);
		ctx.stroke();

		const delta = this.#target - this.#current;
		this.#current += delta * 0.1;
		if (Math.abs(delta) > Number.EPSILON) {
			this.scheduleFrame();
		}
		else {
			this.#current = this.#target;
		}

		const beta = Math.PI / 2 - (Math.PI / 2 - alpha) * this.#current;

		ctx.beginPath();
		ctx.arc(center[0] + Math.cos(beta) * r1, center[1] - Math.sin(beta) * r1, r3, 0, 2.0 * Math.PI);
		ctx.fill();
	}
}

function getCenter(p1, p2, p3) {
	const ax = (p1[0] + p2[0]) / 2.0;
	const ay = (p1[1] + p2[1]) / 2.0;
	const ux = (p1[1] - p2[1]);
	const uy = (p2[0] - p1[0]);
	const bx = (p2[0] + p3[0]) / 2.0;
	const by = (p2[1] + p3[1]) / 2.0;
	const vx = (p2[1] - p3[1]);
	const vy = (p3[0] - p2[0]);
	const dx = ax - bx;
	const dy = ay - by;
	const vu = vx * uy - vy * ux;
	if (vu == 0) {
		return null;
	}

	const g = (dx * uy - dy * ux) / vu;
	return [
		bx + g * vx,
		by + g * vy
	];
}
