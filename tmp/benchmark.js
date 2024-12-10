import { BuPNG } from './bupng';

const bp = new BuPNG(1000,1000);

let l = 0, l1 = 0;

for (let i = 0; i < 1000; i++) {
	bp.plotLine(i, 1, 999 - i, 999);
	l1 = bp.getBase64().length;
	if (l1 > l) {
		l = l1;
	}
}
console.log(l);
