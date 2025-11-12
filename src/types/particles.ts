// Minimal local type for the parts of the particles options we use in the app.
// This avoids hard dependency on the exact external types while still providing
// helpful type-checking for our code. Expand as needed when you add more fields.
export type LinkOptions = {
	opacity?: number;
	blink?: boolean;
	consent?: boolean;
};

export type MoveSpeedRange = {
	min?: number;
	max?: number;
};

export type ParticlesOptions = {
	background?: { color?: { value?: string } };
	fpsLimit?: number;
	fullScreen?: { enable?: boolean };
	interactivity?: any; // keep flexible for complex nested modes/events
	particles?: {
		color?: { value?: string | string[] };
		links?: {
			color?: { value?: string };
			distance?: number;
			enable?: boolean;
			opacity?: number;
			width?: number;
			triangles?: { enable?: boolean };
		};
		move?: {
			direction?: string | number;
			enable?: boolean;
			outModes?: { default?: string };
			random?: boolean;
			speed?: MoveSpeedRange | number;
			straight?: boolean;
			attract?: { enable?: boolean };
			trail?: any;
		};
		number?: { density?: { enable?: boolean; area?: number }; value?: number };
		opacity?: any;
		shape?: any;
		size?: any;
	};
	detectRetina?: boolean;
	smooth?: boolean;
};
