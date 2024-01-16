export class CanvasRenderer {
	width = 0;
	height = 0;
	options;
	#canvas;
	#ctx;
	#frame;
	#onRender;

	constructor(wrapper, canvas, ctx, options) {
		this.options = options;
		this.#canvas = canvas;
		this.#ctx = ctx;
		this.#onRender = time => {
			this.#frame = undefined;
			if (this.width < Number.EPSILON && this.height < Number.EPSILON) {
				return;
			}

			ctx.save();
			this.clear();
			ctx.translate(0.5, 0.5);
			this.render?.(ctx, time);
			ctx.restore();
		};

		const ro = new ResizeObserver(entries => {
			const box = entries[0].contentRect;
			this.width = Math.floor(box.width * devicePixelRatio);
			this.height = Math.floor(box.height * devicePixelRatio);
			this.#canvas.width = this.width;
			this.#canvas.height = this.height;
			this.#canvas.style.width = `${box.width}px`;
			this.#canvas.style.height = `${box.height}px`;
			this.#onRender();
		});

		ro.observe(wrapper);
	}

	clear() {
		this.#ctx.clearRect(0, 0, this.width, this.height);
		if (this.#frame) {
			cancelAnimationFrame(this.#frame);
			this.#frame = undefined;
		}
	}

	scheduleFrame() {
		this.#frame ??= requestAnimationFrame(this.#onRender);
	}

	static create(Handler, wrapperSelector, options = {}) {
		const wrapper = document.querySelector(wrapperSelector);
		const canvas = wrapper.firstElementChild;
		const ctx = canvas.getContext('2d');
		return new Handler(wrapper, canvas, ctx, options);
	}
}
