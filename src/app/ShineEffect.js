export class ShineEffect {
	#onPointerMove;

	constructor(targets) {
		let frame;
		let mouseX;
		let mouseY;

		const onUpdateGradients = () => {
			frame = undefined;
			for (const target of targets) {
				const box = target.getBoundingClientRect();
				target.style.setProperty('--fx-offset-x', `${100.0 * (mouseX - box.left) / box.width}%`);
				target.style.setProperty('--fx-offset-y', `${100.0 * (mouseY - box.top) / box.height}%`);
			}
		};

		this.#onPointerMove = e => {
			if (e.pointerType === 'mouse') {
				mouseX = e.clientX;
				mouseY = e.clientY;
				frame ??= requestAnimationFrame(onUpdateGradients);
			}
		};

		window.addEventListener('pointermove', this.#onPointerMove, { passive: true });
	}

	destroy() {
		window.removeEventListener('pointermove', this.#onPointerMove);
	}

	static create(selector) {
		return new ShineEffect(
			document.querySelectorAll(selector)
		);
	}
}
