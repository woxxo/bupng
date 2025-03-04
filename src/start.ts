#!/usr/bin/env bun

import { BunRequest } from 'bun';
import { BuPNG } from 'bupng';

const bp = [ new BuPNG(5, 5), new BuPNG(350, 350), new BuPNG(150, 150), ];

//background
bp[0].plotLine(0, 0, 3, 0, 0, 255, 0, 255);
bp[0].plotLine(0, 0, 0, 3, 0, 255, 0, 255);

//png1
for (let i = 0; i < 350; i++) {
	for (let j = 0; j < 350; j++) {
		bp[1].plotPixel(j, i, j / 350 * 255 | 0, 0, i / 350 * 255 | 0, j / 350 * 255 | 0);
	}
}
bp[1].plotLine(0, 0, 349, 349, 100, 0, 255, 255)

//png2
for (let i = 0; i < 150; i++) {
	for (let j = 0; j < 150; j++) {
		bp[2].plotPixel(j, i, j % 50 + 150, i / 150 * 255 | 0, 0, (i + j) / 300 * 255 | 0);
	}
}
bp[2].plotLine(149, 0, 0, 149, 100, 0, 255, 255)

export default {
	port: 3055,
	fetch() {
		return new Response('Not Found', { status: 404 });
	},
	routes: {
		'/': () => new Response(
			`<!DOCTYPE html>
			<html>
			<body style="background-image: url('${bp[0].getBase64()}');">
			<h2>Encoded by ${bp[0].version}</h2>
			<img src="/png/1" alt="png1" />
			<img src="/png/2" alt="png2" />
			</body>
			</html>`,
			{ headers: { 'Content-Type': 'text/html; charset=utf-8' } },
		),
		'/png/:id': (req: BunRequest<'/png/:id'>): Response => {
			//console.log(req.params);
			const { id } = req.params;
			return new Response(bp[parseInt(id)].getFile());
		},
	},
}