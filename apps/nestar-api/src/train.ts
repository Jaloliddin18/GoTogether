/*
TASK ZJ:

Shunday function yozing, u berilgan array ichidagi
raqamlarni qiymatini hisoblab qaytarsin.

MASALAN: reduceNestedArray([1, [1, 2, [4]]]); return 8;

Yuqoridagi misolda, array nested bo'lgan holdatda ham,
bizning function ularning yig'indisini hisoblab qaytarmoqda.

function reduceNestedArray(arr: any[]): number {
	return arr.reduce((acc, val) => {
		if (Array.isArray(val)) {
			return acc + reduceNestedArray(val);
		}
		return acc + val;
	}, 0);
}
const result = reduceNestedArray([1, [1, 2, [4]]]);
console.log(result);
*/

/**
 TASK ZK:

Shunday function yozing, bu function har bir soniyada bir marotaba
console'ga 1'dan 5'gacha bo'lgan raqamlarni chop etsin va
5 soniyadan so'ng function o'z ishini to'xtatsin
  
MASALAN: printNumbers();


function printNumbers() {
	let i = 1;

	const intervalId = setInterval(() => {
		console.log(i);
		i++;

		if (i > 5) {
			clearInterval(intervalId);

			setTimeout(() => {}, 5000);
		}
	}, 1000);
}

printNumbers();
 **/
/**
TASK ZM:

Shunday function yozing, va bu function parametr
sifatida raqamlarni qabul qilsin. Bu function qabul qilingan
raqamlarni orqasiga o'girib qaytarsin

MASALAN: reverseInteger(123456789); return 987654321;

Yuqoridagi misolda, function kiritilgan raqamlarni orqasiga
o'girib (reverse) qilib qaytarmoqda. 

function reverseNumber(num: number) {
	if (num === 0) return 0;
	return num.toString().split('').reverse().join('');
}

console.log(reverseNumber(1234567890));
**/
/**
 ZL-TASK:

Shunday function yozing, u parametrda berilgan stringni kebab casega otkazib qaytarsin. Bosh harflarni kichik harflarga ham otkazsin.
MASALAN: stringToKebab(“I love Kebab”) return “i-love-kebab”
 

function stringToKebab(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase();
}
console.log(stringToKebab('I love Kebab'));
*/
/**TASK ZN:

Shunday function yozing, uni array va number parametri bo'lsin.
Function'ning vazifasi ikkinchi parametr'da berilgan raqam, birinchi
array parametr'ning indeksi bo'yicha hisoblanib, shu indeksgacha bo'lgan
raqamlarni indeksdan tashqarida bo'lgan raqamlar bilan o'rnini
almashtirib qaytarsin.

MASALAN: rotateArray([1, 2, 3, 4, 5, 6], 3); return [5, 6, 1, 2, 3, 4]; 

function rotateArray(nums: number[], k: number) {
	k = k % nums.length;

	const rotated = nums
		.slice(nums.length - (k - 1))
		.concat(nums.slice(0, nums.length - (k - 1)));
	return rotated;
}
console.log(rotateArray([1, 2, 3, 4, 5, 6], 3)); // brute force
*/

/**Shunday function yozing, u 2 ta array parametr qabul qilsin.
Siz bu ikki arrayning qiymatlari o'xshash bo'lishini 
(ya'ni, ularning barcha elementlari bir xil bo'lishini) tekshirishingiz kerak.

MASALAN:
areArraysEqual([1, 2, 3], [3, 1, 2]) // true
areArraysEqual([1, 2, 3], [3, 1, 2, 1]) // true
areArraysEqual([1, 2, 3], [4, 1, 2]) // false 

function areArraysEqual(arr1: number[], arr2: number[]) {
	if (arr1.length !== arr2.length) return false;
	const sorted1 = [...arr1].sort();
	const sorted2 = [...arr2].sort();

	for (let i = 0; i < sorted1.length; i++) {
		if (sorted1[i] !== sorted2[i]) {
			return false;
		}
	}
	return true;
}
console.log(areArraysEqual([1, 2, 3], [3, 1, 2]));
*/

/**ZP-TASK:

Anagrammalarni Guruhlash

Sizga stringlar (so'zlar) massivi berilgan. Sizning vazifangiz anagrammalarni birga guruhlashdir.

Eslatma: Anagramma — bu boshqa so'zning harflarini qayta tartiblash orqali hosil qilingan so'z (masalan, "cinema" va "iceman").


INPUT:
const strs = ["eat", "tea", "tan", "ate", "nat", "bat"];

OUTPUT: 
result = [
  ["eat", "tea", "ate"],
  ["tan", "nat"],
  ["bat"]
] 

function groupAnagrams(strs: string[]) {
	const sortedStrs = strs.map((word) => word.split('').sort().join(''));
	const hash = {};

	for (let i = 0; i < strs.length; i++) {
		if (!hash[sortedStrs[i]]) {
			hash[sortedStrs[i]] = [strs[i]];
		} else {
			hash[sortedStrs[i]].push(strs[i]);
		}
	}
	return hash;
}

console.log(groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']));
*/

/**
 TASK ZQ:

Shunday function yozing, bu function berilgan array parametr
ichida ikki marotaba yoki undan ko'p takrorlangan sonlarni alohida
array'da yagonadan qaytarsin qaytarsin.

MASALAN: findDuplicates([1,2,3,4,5,4,3,4]); return [3, 4];
 

function findDuplicates(nums: number[]): number[] {
	const result = [];

	for (let i = 0; i < nums.length; i++) {
		let index = Math.abs(nums[i]) - 1;
		let value = nums[index];

		if (value < 0) {
			result.push(Math.abs(nums[i]));
			nums[index] = 0;
		} else {
			nums[index] = -nums[index];
		}
	}
	return result;
}

console.log(findDuplicates([1, 2, 3, 4, 5, 4, 3, 4]));
*/

/** TASK ZR:

Shunday function yozing, bu function,
berilgan parametr string tarkibidagi raqam va sonlarni
sanab object sifatida qaytarsin.

MASALAN: countNumberAndLetters(“string152%\¥”); return {number: 3, letter: 6}; 

function countNumberAndLetters(str: string): {
	number: number;
	letter: number;
} {
	let result = {
		number: 0,
		letter: 0,
	};

	for (const char of str) {
		if (/[0-9]/.test(char)) {
			result.number++;
		} else if (/[a-zA-Z]/.test(char)) {
			result.letter++;
		}
	}

	return result;
}

console.log(countNumberAndLetters('string152%¥'));
*/
/**TASK ZS:

Shunday function yozing, bu function parametrdagi array ichida
bir marotaba takrorlangan element'ni qaytarsin

MASALAN: singleNumber([4, 2, 1, 2, 1]); return 4; 

function singleNumber(arr: number[]) {
	const count = {};

	for (const num of arr) {
		count[num] = (count[num] || 0) + 1;
	}
	return arr.filter((num) => count[num] === 1);
}

console.log(singleNumber([4, 2, 1, 2, 1]));
*/
/** TASK ZT:

Shunday function yozing, bu function parametrdagi string ichida
bir marotabadan ortiq qaytarilmagan birinchi harf indeksini qaytarsin

MASALAN: firstUniqueCharIndex(“stamp”); return 0;

Yuqoridagi misolda, 'stamp' so'zi tarkibida barcha harflar bir marotabadan
ortiq takrorlanmagan, lekin shartga muvofiq, birinchi topilgan harf indeksi qaytarilmoqda. 

function firstUniqueCharIndex(str: string) {
	const characterCount = {};

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		characterCount[char] = characterCount[char] + 1 || 1;
	}

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		if (characterCount[char] === 1) {
			return i;
		}
	}
	return -1;
}

console.log(firstUniqueCharIndex('stamp'));
*/

/**
 TASK ZU:

Shunday function yozing, va bu function parametr sifatida
raqamlardan iborat array'ni qabul qilsin. Function'ning vazifasi,
berilgan parametr array tarkibida takrorlanmagan raqamlarni topib
ularni yig'indisini qaytarsin.

MASALAN: sumOfUnique([1,2,3,2]); return 4;

Yuqoridagi misolda, argument sifatida pass qilinayotgan array
tarkibida bir marotabadan ortiq takrorlanmagan raqamlar, bular '1', '3'.
Va natija sifatida yig'indi 4'ga teng.
 */

function sumOfUnique(arr: number[]): number {
	const count = {};

	for (const num of arr) {
		count[num] = (count[num] || 0) + 1;
	}
	return arr
		.filter((num) => count[num] === 1)
		.reduce((sum, num) => sum + num, 0);
}

console.log(sumOfUnique([1, 2, 3, 2]));
