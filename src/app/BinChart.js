import { CanvasRenderer } from './CanvasRenderer';

export class BinChart extends CanvasRenderer {
	#bins;

	update(bins) {
		this.#bins = bins;
		this.scheduleFrame();
	}

	render(ctx) {
		const bins = this.#bins;
		const wStep = this.width / bins.length;
		const wBin = wStep - 1.0 * devicePixelRatio;
		const radius = wBin / 2;
		const y = Math.floor(this.height / 2);
		const h = y - radius - 1.0 * devicePixelRatio;

		ctx.fillStyle = this.options.color;

		for (let i = 0; i < bins.length; ++i) {
			const xs = i * wStep;
			const xm = xs + radius;
			const xe = xs + wBin;
			const p = bins[i] * h;

			ctx.beginPath();
			ctx.moveTo(xs, y);

			ctx.arcTo(xs, y - p - radius, xm, y - p - radius, radius);
			ctx.arcTo(xe, y - p - radius, xe, y             , radius);

			ctx.arcTo(xe, y + p + radius, xm, y + p + radius, radius);
			ctx.arcTo(xs, y + p + radius, xs, y             , radius);

			ctx.closePath();
			ctx.fill();
		}
	}
}
