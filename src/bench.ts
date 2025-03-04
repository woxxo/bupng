import { BuPNG } from 'bupng';

const ITERATIONS = 100;

console.time('png');
const bp = new BuPNG(1000,1000);

let l = 0, l1 = 0;

console.timeLog('png');
let t = Bun.nanoseconds();
console.log(t);

for (let i = 0; i < 100; i++) {
	//const bp1 = new BuPNG(1000,1000);
	bp.plotLine(i, 1, 999 - i, 999);
	l1 = bp.getBase64().length;
	if (l1 > l) {
		l = l1;
	}
}
console.log(l);
console.timeEnd('png');
t = Bun.nanoseconds() - t;
console.log(`${ITERATIONS / (t / 1_000_000_000)} iter/sec`);

//level	size	speed
//1		38610	268
//3		37418	268
//4		15498	114
//5		15494	113
//6		14330	99
//7		14314	86
//8		13482	22
//9		10718	7
