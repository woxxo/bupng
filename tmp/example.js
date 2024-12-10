import { BuPNG } from './bupng';

const x = 700, y = 300;
const bp = new BuPNG(x, y);

const bp1 = new BuPNG(5, 5); //background
bp1.plotLine(2, 0, 2, 4, 0, 150, 0, 150);
bp1.plotLine(0, 2, 4, 2, 0, 150, 0, 150);

export default {
	port: 3034,
	fetch(request) {
		let s = `<html><body style="background-image: url('${bp1.getBase64()}');">`;

		for (let i = 0; i < x; i++) {
			for (let j = 0; j < y; j++) {
				bp.plotPixel(i, j, 255-(i%100), i%255, i%70+180, i%50+200);
			}
			//bp.plotPixel(i, j, 100, 0, 255, 255);
		}
		bp.plotLine(0, 0, x - 1, y - 1);
		
		s += `<img src="${bp.getBase64()}">`;
		
		for (let i = 0; i < 10; i++) {
			bp.plotLine(i * 50, 30, x - i * 30, y - 30);
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
