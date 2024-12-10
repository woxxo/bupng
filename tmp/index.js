import { BuPNG } from './bupng';

const bp = new BuPNG(200, 200);

const bp1 = new BuPNG(5, 5); //background
bp1.plotLine(2, 0, 2, 4, 0, 255, 0, 255);
bp1.plotLine(0, 2, 4, 2, 0, 255, 0, 255);

export default {
	port: 3034,
	fetch(request) {
		let s = `<html><body style="background-image: url('${bp1.getBase64()}');">`;

		for (let i = 0; i < 200; i++) {
			for (let j = 0; j < 200; j++) {
				bp.plotPixel(i, j, 255-i, i, i%50+190, i+50);
			}
			bp.plotPixel(i, i, 100, 0, 255, 255);
		}
		s += `<img src="${bp.getBase64()}">`;
		
		for (let i = 0; i < 10; i++) {
			bp.plotLine(i * 15, 30, 200 - i * 15, 170);
		}
		s += `<img src="mycoolpng.png">`;
		bp.saveFile('/home/bew/bin/nginx/html/mycoolpng.png');
		
		s += `<h3>Encoded by ${bp.version}</h3></body></html>`;
		return new Response(s, {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
			},
		});
	},
}
