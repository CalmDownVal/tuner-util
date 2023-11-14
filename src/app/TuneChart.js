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

		const p0 = { x: padding, y: this.height };
		const p1 = { x: this.width / 2, y: r2 + line + padding };
		const p2 = { x: this.width - padding, y: this.height };

		const offset = p1.x ** 2 + p2.y ** 2;
		const bc = (p0.x ** 2 + p0.y ** 2 - offset) * 0.5;
		const cd = (offset - p2.x ** 2 - p2.y ** 2) * 0.5;
		const det = (p0.x - p1.x) * (p1.y - p2.y) - (p1.x - p2.x) * (p0.y - p1.y);
		const cx = (bc * (p1.y - p2.y) - cd * (p0.y - p1.y)) / det;
		const cy = (cd * (p0.x - p1.x) - bc * (p1.x - p2.x)) / det;
		const r1 = Math.sqrt((p2.x - cx) ** 2 + (p2.y - cy) ** 2);
		const alpha = Math.asin(1.0 - (this.height - p1.y) / r1);

		ctx.beginPath();
		ctx.arc(cx, cy, r1, Math.PI - alpha, alpha, false);
		ctx.stroke();

		ctx.clearRect(cx - r2, cy - r1 - r2, 2.0 * r2, 2.0 * r2);

		ctx.beginPath();
		ctx.arc(cx, cy - r1, r2, 0, 2.0 * Math.PI, false);
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
		ctx.arc(cx + Math.cos(beta) * r1, cy - Math.sin(beta) * r1, r3, 0, 2.0 * Math.PI);
		ctx.fill();
	}
}
