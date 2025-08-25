import { interpretCode } from './simpl.js';
import * as Chess from './chess.js';

const chessboardDisplay = document.getElementById("chess-board");
const startChessButton = document.getElementById("start-chess");
const chessPromotion = document.getElementById("chess-promotion");

/* Chess stuff */
let init = false;
function initGame () {
    let light = true;
    if (!init) {
        for (let i = 0; i < 8; i++) {
            light = !light;
            for (let j = 0; j < 8; j++) {
                light = ! light;
                let square = document.createElement("button");
                square.id = `tile-${i}-${j}`;
                square.onclick = () => {Chess.tileClick(i, j)};
                square.addEventListener("click", ()=>{  });
                square.classList.add("chess-square");
                if (light) square.classList.add("light-square");
                else square.classList.add("dark-square");
                let texture = document.createElement("img");
                texture.classList.add("tile-texture");
                texture.setAttribute("src", "../textures/No.png");
                square.appendChild(texture);
                chessboardDisplay.appendChild(square);
            }
        }
        for (let child of chessPromotion.children) {
            let name = child.id[child.id.length - 1];
            child.addEventListener("click", () => {Chess.promoteClick(name)});
        }

        init = true;
    }
    Chess.initGame();

}
startChessButton.addEventListener("click", ()=>initGame())



/* SIMPL stuff */

const simpl = document.getElementById("simpl");
const simplRun = document.getElementById("simpl-run");
const simplInput = document.getElementById("simpl-input");
const simplConsole = document.getElementById("simpl-console");
const simplFib = document.getElementById("simpl-demo-1");
const simplfunc = document.getElementById("simpl-demo-2");


simplInput.value = `
; SIMPL DEMO ;

MODUL fib UNTUK n :
    KASUS :
        KALAU n <= 0 : JAWAB 0 :
        KALAU n == 1 : JAWAB 1 :
        KALAU n == 2 : JAWAB 1 :
    :

    JAWAB [TANYA fib n-1] + [TANYA fib n-2]
:

CETAK [TANYA fib 10]
    `;

function evaluateSimpl () {
    simplConsole.value = interpretCode(simplInput.value);
}

function fibDemo () {
    simplInput.value = 
    `
; SIMPL SYNTAX DEMO ;
; uhh this can crash the site ;
; careful with infinite loops ;
; :''') ;

; comments must start and end with semicolon ;

; variable declaration (only support number :') ) ;
DATUM num = 1
DATUM a = 2
DATUM b = 3
DATUM c = a + b
CETAK c

; support booleans but they're of type number ;
DATUM kondisi = BENAR ; value : 1 ;
DATUM ngarang = SALAH ; value : 0 ;

DATUM kejadian = (kondisi == BENAR) | (ngarang == BENAR) ; value : 1 ;
; ALWAYS PARENTHESIZE ;
CETAK kejadian

; change value ;
RUBAH num = 100
CETAK num

; newline ;
CETAK NIHIL

; conditionals and loops ;

; if ;
KALAU BENAR : CETAK 1 :

; if else chain ;
KASUS:
    KALAU SALAH : CETAK -1 :
    KALAU BENAR : CETAK 7 :
    KALAU BENAR : CETAK -1 : ; didnt exec ; 
: CETAK NIHIL

; while ;
SLAGI a > 0 : 
    CETAK a
    RUBAH a = a - 1
: CETAK NIHIL

; until ;
SAMPE a == 2 :
    CETAK a
    RUBAH a = a + 1
: CETAK NIHIL

; break and continue ;
RUBAH a = 1
SLAGI a > 0:
    RUBAH a = a + 1

    KALAU a == 5 : LEWAT :
    KALAU a == 10 : HENTI :

    CETAK a

: CETAK NIHIL

; isnt block scoped ;
KALAU BENAR : DATUM innerscope = 100 :
CETAK innerscope
CETAK NIHIL


; function : tanya/jawab ;
; is actually block scoped ;

MODUL kasih_satu :
    JAWAB 1 ; this returns 1 ;
:

CETAK [TANYA kasih_satu]

; with args ;
MODUL sum UNTUK a, b, c :
    JAWAB a + b + c
:

CETAK [TANYA sum 1,2,3] ; mind the commas ;
CETAK NIHIL

`;
}

function funcDemo () {
    simplInput.value = `
; SIMPL DEMO ;

; you can do funky stuff with functions ;
; no lambda...... yet ;
; but.. ;
MODUL portable UNTUK a,b :JAWAB a+b:

DATUM lol = portable

CETAK [TANYA lol 1,2]
CETAK NIHIL

; as argument ;
MODUL twice UNTUK f, n:
    JAWAB [TANYA f [TANYA f n]]
:

MODUL square UNTUK x :JAWAB x * x:

CETAK [TANYA twice square, 5]
CETAK NIHIL

; and this thing ;

MODUL sqrt UNTUK x:
    MODUL avr UNTUK a,b :JAWAB (a+b)/2:
    MODUL abs UNTUK x:
        ; x is local here ;
        KALAU x < 0 : JAWAB -x :
        JAWAB x
    :

    DATUM tolerance = 0.00001
    DATUM guess = 1
    DATUM next = 0
    SLAGI BENAR :
        RUBAH next = [TANYA avr guess, x/guess]
        KALAU [TANYA abs (next - guess)] < tolerance:
            JAWAB next
        :
        RUBAH guess = next
    :
:

CETAK [TANYA sqrt 100]
; CETAK [TANYA avr 1, 2] ;
; ^^ throws an error ;
`;
}

simplfunc.addEventListener("click", funcDemo);
simplFib.addEventListener("click", fibDemo);
simplRun.addEventListener("click", evaluateSimpl);