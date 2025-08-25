/*

SIMPL INDONESIAN MOCK PROGRAMMING LANGUAGE
  S       I       M        P         L

DATUM NIHIL MODUL BENAR SALAH UNTUK CETAK TANYA JAWAB RUBAH CETAK SAMPE SLAGI KALAU KASUS LEWAT HENTI
= == != >= <= > < ! & | ( ) + - / * : [ ] ; . ,

=============================
=     Peraturan grammar     =
=============================

pembuatan_variabel  = tipe ID SAMA_DENGAN ekspresi

perubahan_variabel  = RUBAH ID SAMA_DENGAN ekspresi

tipe                = DATUM

pembuatan_modul     = MODUL ID (UNTUK ID (KOMA ID)*) blok

blok                = TITIK_DUA baris_pertanyaan TITIK_DUA

ekspresi            = aritmatika (KONDISIONAL aritmatika)*
aritmatika          = produk ((PLUS | MINUS) produk)*
produk              = faktor ((KALI | BAGI) faktor)*
faktor              = ANGKA_LIT
                    | KURUNG_B ekspresi KURUNG_T
                    | tanyaan
                    | variabel
                    | NIHIL
                    | BENAR
                    | SALAH

KONDISIONAL         = AMPERSAN | PIPA | SAMA_SAMA | LEBIH | LEBIH_SAMA | KURANG | KURANG_SAMA | TIDAK_SAMA

klausa_kalau        = KALAU ekspresi blok

klausa_kasus        = KASUS TITIK_DUA klausa_kalau* TITIK_DUA

klausa_sampe        = SAMPE ekspresi blok
klausa_slagi        = SLAGI ekspresi blok

baris_pernyataan    = pernyataan*

kosong              =

pernyataan          = klausa_kalau
                    | klausa_sampe
                    | klausa_slagi
                    | pembuatan_modul
                    | pembuatan_variabel
                    | perubahan_variabel
                    | kosong
                    | jawaban
                    | tanyaan
                    | cetakan
                    | LEWAT
                    | HENTI

cetakan             = CETAK (ekspresi | NIHIL)

tanyaan             = SIKU_B TANYA ID (ekspresi (KOMA ekspresi)*) SIKU_T
jawaban             = JAWAB ekspresi

*/

///////////////////////////////////////////
//                                       // 
//          LEXER / TOKENIZER            //
//                                       //
///////////////////////////////////////////

// ENUMS OF TOKEN

// KEYWORDS
let NIHIL = 0 , DATUM = 1 , MODUL = 2 , BENAR = 3 , SALAH = 4, 
    UNTUK = 5 , CETAK = 6 , TANYA = 7 , JAWAB = 8 , RUBAH = 9, 
    SAMPE = 10, SLAGI = 11, KALAU = 12, LEWAT = 13, HENTI = 14, 
    KASUS = 36,
    
    // SYMBOLS
    SAMA_DENGAN = 15, SAMA_SAMA = 16, TIDAK_SAMA = 17, LEBIH_SAMA = 18, KURANG_SAMA = 19,
    LEBIH       = 20, KURANG    = 21, SERU       = 22, AMPERSAN   = 23, PIPA        = 24, 
    KURUNG_B    = 25, KURUNG_T  = 26, PLUS       = 27, MINUS      = 28, KALI        = 29, 
    BAGI        = 30, TITIK_DUA = 31, SIKU_B     = 32, SIKU_T     = 33, KOMA        = 34,

    ANGKA_LIT = 35, ID = 36,  EOF = -1;


const TOKEN_STRING = new Map ([
    [NIHIL, "NIHIL"], [DATUM, "DATUM"], [MODUL, "MODUL"], [BENAR, "BENAR"], [SALAH, "SALAH"],
    [UNTUK, "UNTUK"], [CETAK, "CETAK"], [TANYA, "TANYA"], [JAWAB, "JAWAB"], [RUBAH, "RUBAH"],
    [SAMPE, "SAMPE"], [SLAGI, "SLAGI"], [KALAU, "KALAU"], [LEWAT, "LEWAT"], [HENTI, "HENTI"],
    [KASUS, "KASUS"],

    [SAMA_DENGAN, "SAMA_DENGAN"], [SAMA_SAMA, "SAMA_SAMA"], [TIDAK_SAMA, "TIDAK_SAMA"], 
    [LEBIH_SAMA, "LEBIH_SAMA"], [KURANG_SAMA, "KURANG_SAMA"], [LEBIH, "LEBIH"], [KURANG, "KURANG"], 
    [SERU, "SERU"], [AMPERSAN, "AMPERSAN"], [PIPA, "PIPA"], 
    [KURUNG_B, "KURUNG_B"], [KURUNG_T, "KURUNG_T"], [PLUS, "PLUS"], [MINUS, "MINUS"], [KALI, "KALI"],
    [BAGI, "BAGI"], [TITIK_DUA, "TITIK_DUA"], [SIKU_B, "SIKU_B"], [SIKU_T, "SIKU_T"], [KOMA, "KOMA"],
    [ANGKA_LIT, "ANKGA_LIT"], [ID, "ID"], [EOF, "EOF"]
]);

class SIMPLError extends Error {}

class Token {
    constructor (type, value = null) {
        this.type = type;
        this.value = value;
        if (value == null) this.value = TOKEN_STRING.get(this.type);
    }

    toString () {
        return "<Token:" + TOKEN_STRING.get(this.type) + ` | Value: ${this.value}>`;
    }
}

class Lexer {

    #RESERVED_KEYWORDS = new Map ([
        ["NIHIL", new Token(NIHIL)], ["DATUM", new Token(DATUM)], ["MODUL", new Token(MODUL)], 
        ["BENAR", new Token(BENAR)], ["SALAH", new Token(SALAH)], ["UNTUK", new Token(UNTUK)], 
        ["CETAK", new Token(CETAK)], ["TANYA", new Token(TANYA)], ["JAWAB", new Token(JAWAB)], 
        ["RUBAH", new Token(RUBAH)], ["SAMPE", new Token(SAMPE)], ["SLAGI", new Token(SLAGI)], 
        ["KALAU", new Token(KALAU)], ["LEWAT", new Token(LEWAT)], ["HENTI", new Token(HENTI)],
        ["KASUS", new Token(KASUS)],
    ]);

    constructor (text) {
        this.text = text.replace(/[\n\t\r]+/g, " ");
        this.pos = 0;
        this.currentChar = this.text[0];
    }

    advance () {
        this.pos++;
        if (this.pos > this.text.length - 1)
            this.currentChar = null;
        else this.currentChar = this.text[this.pos];
    }

    number () {
        let result = "";
        let isFloat = false;
        while (this.isNumeric(this.currentChar) || this.currentChar == ".") {
            if (this.currentChar =="." && isFloat) throw new SIMPLError("Lexing Error: titik ganda pada angka");
            if (this.currentChar == "." && !isFloat) isFloat = true;
            result += this.currentChar;
            this.advance();
        }
        return new Token(ANGKA_LIT, Number(result));
    }

    skipWhitespace () {
        while (this.currentChar && this.currentChar == " ") this.advance();
    }

    skipComments () {
        // first semicolon
        this.advance();
        while (this.currentChar && this.currentChar != ";") this.advance();
        if (!this.currentChar) throw new SIMPLError("Lexing error: komen harus diterminasi dengan titik koma (;)");
        // last semicolon
        this.advance();
    }

    id ()  {
        let result = "";
        while (this.isAlpha(this.currentChar) || this.isNumeric(this.currentChar)) {
            result += this.currentChar;
            this.advance();
        }

        return this.#RESERVED_KEYWORDS.has(result.toUpperCase()) ? this.#RESERVED_KEYWORDS.get(result.toUpperCase()): new Token(ID, result);
    }

    isNumeric (what) {
        return /^\d$/.test(what);
    }

    isAlpha (what) {
        return /^[a-zA-Z_]$/.test(what);
    }

    peek (len = 1) {
        let peekPos = this.pos + len;
        if (peekPos > this.text.length - 1) return null;
        else return this.text.length[peekPos];
    }

    getNextToken () {
        while (this.currentChar) {
            if (this.currentChar === " ") { this.skipWhitespace(); continue; }
            if (this.currentChar === ";") { this.skipComments(); continue; }

            if (this.isNumeric(this.currentChar)) return this.number();
            if (this.isAlpha(this.currentChar)) return this.id();

            switch (this.currentChar) {
                case "&": this.advance(); return new Token(AMPERSAN);
                case "|": this.advance(); return new Token(PIPA);
                case "+": this.advance(); return new Token(PLUS);
                case "-": this.advance(); return new Token(MINUS);
                case "/": this.advance(); return new Token(BAGI);
                case "*": this.advance(); return new Token(KALI);
                case "(": this.advance(); return new Token(KURUNG_B);
                case ")": this.advance(); return new Token(KURUNG_T);
                case "[": this.advance(); return new Token(SIKU_B);
                case "]": this.advance(); return new Token(SIKU_T);
                case ":": this.advance(); return new Token(TITIK_DUA);
                case ",": this.advance(); return new Token(KOMA);

                case "=":
                    this.advance();
                    if (this.currentChar == "=") { this.advance(); return new Token(SAMA_SAMA); }
                    else return new Token(SAMA_DENGAN);
                case ">":
                    this.advance();
                    if (this.currentChar == "=") { this.advance(); return new Token(LEBIH_SAMA); }
                    else return new Token(LEBIH);
                case "<":
                    this.advance();
                    if (this.currentChar == "=") { this.advance(); return new Token(KURANG_SAMA); }
                    else return new Token(KURANG);
                case "!":
                    this.advance();
                    if (this.currentChar == "=") { this.advance(); return new Token(TIDAK_SAMA); }
                    else return new Token(SERU);
                default: throw new SIMPLError(`Lexing Error: simbol "${this.currentChar}" tidak valid`);
            }
        }
    }
}

///////////////////////////////////////////
//                                       // 
//                PARSER                 //
//                                       //
///////////////////////////////////////////

class AST {
    constructor (name) { this.name = name; }
}

class BinOp extends AST {
    constructor (left, op, right) {
        super("BinOp");
        this.left = left;
        this.op = op;
        this.right = right;
    }
}

class UnaryOp extends AST {
    constructor (op, right) {
        super("UnaryOp");
        this.op = op;
        this.right = right;
    }
}

class Numeric extends AST {
    constructor (token, value) {
        super ("Numeric")
        this.token = token;
        this.value = value;
    }
}

class Variable extends AST {
    constructor (id, type) {
        super("Variable");
        this.id = id;
        this.type = type;
    }
}

class VariableDecl extends AST {
    constructor (id, right) {
        super("VariableDecl");
        this.id = id;
        this.right = right;
    }
}

class ModulDecl extends AST {
    constructor (id, args, block) {
        super("ModulDecl");
        this.id = id;
        this.args = args;
        this.block = block;
    }
}

class ModulTanya extends AST {
    constructor(id,args) {
        super("ModulTanya");
        this.id = id;
        this.args = args;
    }
}

class RubahVariable extends AST {
    constructor(id, value) {
        super("RubahVariable");
        this.id = id;
        this.value = value;
    }
}

class KalauClause extends AST {
    constructor(expression, block) {
        super("KalauClause");
        this.expression = expression;
        this.block = block;
    }
}

class KasusClause extends AST {
    constructor() {
        super("KasusClause");
        this.kasusList = [];
    }
}

class SampeClause extends AST {
    constructor(expression, block) {
        super("SampeClause");
        this.expression = expression;
        this.block = block;
    }
}

class SlagiClause extends AST {
    constructor(expression, block) {
        super("SlagiClause");
        this.expression = expression;
        this.block = block;
    }
}

class Cetak extends AST {
    constructor(expression) {
        super("Cetak");
        this.expression = expression;
    }
}

class StatementList extends AST {
    constructor() {
        super("StatementList");
        this.children = [];
    }
}

class Block extends AST {
    constructor (statements) {
        super("Block");
        this.statements = statements;
    }
}

class Program extends AST {
    constructor() {
        super("Program");
        this.statements;
    }
}

class NoOp extends AST {
    constructor () { super ("NoOp"); }
}

class Lewat extends AST {
    constructor () { super("Lewat"); }
}

class Henti extends AST {
    constructor () { super("Henti"); }
}

class Nihil extends AST {
    constructor () { super("Nihil"); }
}

class Jawab extends AST {
    constructor (expression) {
        super("Jawab");
        this.expression = expression;
    }
}

class Parser {
    constructor (lex) {
        this.lex = lex;
        this.currentToken = lex.getNextToken();
    }
    
    eat (token) {
        if (token === this.currentToken.type) {
            // console.log(this.currentToken); // DEBUGGING HEAVEN STARTS HERE
            this.currentToken = this.lex.getNextToken();
        } else {
            let a = TOKEN_STRING.get(token);
            let b = TOKEN_STRING.get(this.currentToken.type);
            throw new SIMPLError(`Parsing Error: token tidak valid, menemukan ${b}, harusnya ${a} \nCek bila kurang pengetikan suatu kata.`);
        }
    }

    tanyaan () {

        // tanyaan = SIKU_B TANYA ID (ekspresi (KOMA ekspresi)*) SIKU_T

        this.eat(SIKU_B);
        this.eat(TANYA);
        let id = this.currentToken.value;
        this.eat(ID);
        let args = [];
        if (this.currentToken.type !== SIKU_T) {
            args.push(this.ekspresi());
            while (this.currentToken.type === KOMA) {
                this.eat(KOMA);
                args.push(this.ekspresi());
            }
        }
        this.eat(SIKU_T);
        return new ModulTanya(id, args);
    }

    faktor () {
        /*
        faktor              = ANGKA_LIT
                            | KURUNG_B ekspresi KURUNG_T
                            | tanyaan
                            | variabel
                            | BENAR
                            | SALAH
        */

        let token = this.currentToken; 
        switch(token.type) {
            case ANGKA_LIT: 
                this.eat(ANGKA_LIT);
                return new Numeric(token, token.value);
            case KURUNG_B: 
                this.eat(KURUNG_B);
                let result = this.ekspresi();
                this.eat(KURUNG_T);
                return result;
            case TITIK_DUA:
                return this.tanyaan();
            case ID:
                this.eat(ID);
                return new Variable(token.value);
            case BENAR:
                this.eat(BENAR);
                return new Numeric(token, 1);
            case SALAH:
                this.eat(SALAH);
                return new Numeric(token, 0);
            case NIHIL:
                this.eat(NIHIL);
                return new Nihil();
            case MINUS:
                this.eat(MINUS);
                return new UnaryOp(token, this.faktor());
            case PLUS:
                this.eat(PLUS);
                return new UnaryOp(token, this.faktor());
            case SERU:
                this.eat(SERU);
                return new UnaryOp(token, this.faktor());
            case SIKU_B:
                return this.tanyaan();
            default: throw new SIMPLError("Parsing Error: ekspresi invalid");
        }
    }

    produk () {

        // produk = faktor ((KALI | BAGI) faktor)*

        let result = this.faktor();
        
        while (this.currentToken && [KALI, BAGI].some(val=>val===this.currentToken.type)) {
            let token = this.currentToken;
            if (token.type === BAGI) {
                this.eat(BAGI);
                result = new BinOp(result, token, this.produk());
            } else if (token.type === KALI) {
                this.eat(KALI);
                result = new BinOp(result, token, this.produk());
            }
        }

        return result;
    }

    aritmatika () {

        // aritmatika = produk ((PLUS | MINUS) produk)*

        let result = this.produk();

        while (this.currentToken && [PLUS, MINUS].some(val=>val===this.currentToken.type)) {
            let token = this.currentToken;
            if (token.type === PLUS) {
                this.eat(PLUS);
                result = new BinOp(result, token, this.produk());
            } else if (token.type === MINUS) {
                this.eat(MINUS);
                result = new BinOp(result, token, this.produk());
            }
        }

        return result;
    }

    ekspresi () {
        /*
        ekspresi            = aritmatika (KONDISIONAL aritmatika)*
        aritmatika          = produk ((PLUS | MINUS) produk)*
        produk              = faktor ((KALI | BAGI) faktor)*
        faktor              = ANGKA_LIT
                            | KURUNG_B ekspresi KURUNG_T
                            | tanyaan
                            | variabel
                            | BENAR
                            | SALAH
        KONDISIONAL         = AMPERSAN | PIPA | SAMA_SAMA | LEBIH | LEBIH_SAMA | KURANG | KURANG_SAMA | TIDAK_SAMA
        */

        let result = this.aritmatika();

        while (this.currentToken && 
                [AMPERSAN, PIPA, SAMA_SAMA, LEBIH, LEBIH_SAMA, KURANG, KURANG_SAMA, TIDAK_SAMA].some(val=>val===this.currentToken.type)) {
            let token = this.currentToken;
            switch (token.type) {
                case AMPERSAN: 
                    this.eat(AMPERSAN);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case PIPA:
                    this.eat(PIPA);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case SAMA_SAMA:
                    this.eat(SAMA_SAMA);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case LEBIH:
                    this.eat(LEBIH);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case LEBIH_SAMA:
                    this.eat(LEBIH_SAMA);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case KURANG:
                    this.eat(KURANG);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case KURANG_SAMA:
                    this.eat(KURANG_SAMA);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
                case TIDAK_SAMA:
                    this.eat(TIDAK_SAMA);
                    result = new BinOp(result, token, this.aritmatika());
                    continue;
            }
        }

        return result;
    }

    blok () {

        // blok = TITIK_DUA baris_pernyataan TITIK_DUA

        this.eat(TITIK_DUA);
        let result = new Block(this.barisPernyataan());
        this.eat(TITIK_DUA);
        return result;
    }

    klausaKalau () {

        // klausa_kalau = KALAU ekspresi blok

        this.eat(KALAU);
        let kondisi = this.ekspresi();
        let blok = this.blok();
        return new KalauClause(kondisi, blok);
    }

    klausaKasus () {

        // klausa_kasus = KASUS TITIK_DUA klausa_kalau* TITIK_DUA

        this.eat(KASUS);
        this.eat(TITIK_DUA);
        let result = new KasusClause();
        while (this.currentToken.type === KALAU) {
            result.kasusList.push(this.klausaKalau());
        }
        this.eat(TITIK_DUA);
        return result;

    }

    klausaSampe () {

        // klausa_sampe = SAMPE ekspresi blok

        this.eat(SAMPE);
        let kondisi = this.ekspresi();
        let blok = this.blok();
        return new SampeClause(kondisi, blok);
    }

    klausaSlagi () {

        // klausa_slagi = SLAGI ekspresi blok

        this.eat(SLAGI);
        let kondisi = this.ekspresi();
        let blok = this.blok();
        return new SlagiClause(kondisi, blok);
    }

    pembuatanModul () {

        // pembuatan_modul = MODUL ID (UNTUK (ID)*) blok

        this.eat(MODUL);
        let funcID = this.currentToken.value;
        this.eat(ID);

        let args = [];
        if (this.currentToken.type === UNTUK) {
            this.eat(UNTUK);
            args.push(this.currentToken.value);
            this.eat(ID)
            while (this.currentToken.type === KOMA) {
                this.eat(KOMA);
                args.push(this.currentToken.value);
                this.eat(ID);
            }
        }
        let blok = this.blok();

        return new ModulDecl(funcID, args, blok);
    }

    pembuatanVariabel () {

        // pembuatan_variabel = DATUM ID SAMA ekspresi

        this.eat(DATUM);
        let id = this.currentToken.value;
        this.eat(ID);
        this.eat(SAMA_DENGAN);
        let result = this.ekspresi();
        return new VariableDecl(id, result);
    }

    perubahanVariabel () {

        // perubahan_variabel = RUBAH ID SAMA ekspresi

        this.eat(RUBAH);
        let id = this.currentToken.value;
        this.eat(ID);
        this.eat(SAMA_DENGAN);
        let result = this.ekspresi();
        return new RubahVariable(id, result);
    }

    jawaban () {
        
        // jawaban = JAWAB ekspresi

        this.eat(JAWAB);
        return new Jawab(this.ekspresi());
    }



    pernyataan () {
        /*
        pernyataan  = klausa_kalau
                    | klausa_kasus
                    | klausa_sampe
                    | klausa_slagi
                    | pembuatan_modul
                    | pembuatan_variabel
                    | perubahan_variabel
                    | kosong
                    | jawaban
                    | tanyaan
                    | LEWAT
                    | HENTI
                    | CETAK ekspresi
        */
        let token = this.currentToken;
        switch (token.type) {
            case KALAU: return this.klausaKalau();
            case KASUS: return this.klausaKasus();
            case SAMPE: return this.klausaSampe();
            case SLAGI: return this.klausaSlagi();
            case MODUL: return this.pembuatanModul();
            case DATUM: return this.pembuatanVariabel();
            case RUBAH: return this.perubahanVariabel();
            case JAWAB: return this.jawaban();
            case SIKU_B: return this.tanyaan();
            case LEWAT: this.eat(LEWAT); return new Lewat();
            case HENTI: this.eat(HENTI); return new Henti();
            case CETAK:
                this.eat(CETAK);
                return new Cetak(this.ekspresi());
            default: return new NoOp();
        }
    }

    barisPernyataan () {

        // barisPernyataan = (pernyataan)*

        let result = new StatementList();
        while (this.currentToken && 
            [KALAU, KASUS, SAMPE, SLAGI, MODUL, DATUM, RUBAH, JAWAB, SIKU_B, LEWAT, HENTI, CETAK].some(val=>val===this.currentToken.type)) {
            result.children.push(this.pernyataan());
        }
        return result;
    }

    program() {
       let result = new Program();
       result.statements = this.barisPernyataan();
       return result;
    }

    parse () {
        return this.program();
    }
}

///////////////////////////////////////////
//                                       // 
//             INTERPRETER               //
//                                       //
///////////////////////////////////////////

class NodeVisitor {
    constructor () {}

    visit (node) {
        // console.log(node); // DEBUGGING HEAVEN STARTS HERE
        let funcName = "visit" + node.name;
        if (funcName in this) {
            return this[funcName](node);
        } else throw new SIMPLError (`Interpreting Error: Tidak ada fungsi ${funcName}`);
    }
}

class Hentikan extends SIMPLError {}
class Lewatkan extends SIMPLError {}
class Jawaban extends SIMPLError {
    constructor (value) {
        super();
        this.value = value;
    }
}

class Interpreter extends NodeVisitor {

    globalScope = {
        level: 0,
    };

    symbolScopeTable = {

    };

    outputStream = "";

    constructor (parser) {
        super();
        this.parser = parser;
        this.tree = this.parser.parse();

        // RE-ASSIGN-ing will change the reference, manipulating will change both of them
        this.currentScope = this.globalScope;
    }

    getVariable (name) {
        let scope = this.symbolScopeTable[name][0];
        let referenceScope = this.currentScope;
        while (referenceScope.level > scope) referenceScope = referenceScope.outerScope; 
        if (referenceScope.hasOwnProperty(name)) {
            return referenceScope[name];
        } else throw new SIMPLError (`Interpreting Error: Variabel tidak ditemukan ${name}`);
    }

    generateVariable (name, value) {
        if (this.currentScope.hasOwnProperty(name)) {
            throw new SIMPLError (`Interpreting Error: Nama bertabrakan ${name} sudah terbuat`);
        }
        this.currentScope[name] = { value: structuredClone(value) };
        if (this.symbolScopeTable[name]) {
            this.symbolScopeTable[name].unshift(this.currentScope.level);
        } else this.symbolScopeTable[name] = [this.currentScope.level];
    }

    changeVariable (name, value) {
        if (!this.symbolScopeTable[name]) 
            throw new SIMPLError(`Interpreting Error: Variabel tidak ditemukan ${name}`);
        let refVar = this.getVariable(name);
        // this actually modifies the REAL scope because its reference chaining
        refVar.value =  structuredClone(value) ;
    }

    createEnvironment () {
        let prevLevel = this.currentScope.level;
        this.currentScope = { level:prevLevel+1, outerScope:this.currentScope };
    }

    createFunctionEnvironment (funcName, args) {
        let funcTemplate = this.getVariable(funcName).value;
        if (funcTemplate.funcArgs.length !== args.length) {
            throw new SIMPLError(`Interpreter Error: Arity tidak sama, argumen terlalu ${funcTemplate.args.length > args.length ? "banyak" : "sedikit"}`);
        }

        this.createEnvironment();

        funcTemplate.funcArgs.forEach((arg, idx) => {
            this.generateVariable(arg, args[idx]);
        });
    }

    leaveEnvironment () {
        for (let symbol in this.symbolScopeTable) {
            if (this.symbolScopeTable[symbol][0] === this.currentScope.level)
                this.symbolScopeTable[symbol].shift();
        }
        // funny because outerscope is IN the innerscope
        this.currentScope = this.currentScope.outerScope;
    }

    ///
    /// VISIT FUNCTION 
    ///

    visitModulDecl (node) {
        this.generateVariable(node.id, { funcArgs:node.args, funcNodes :[...node.block.statements.children], funcInitScope:this.currentScope.level });
    }

    visitNihil () { return null; }

    // MEAT
    visitModulTanya (node) {
        let funcRef = this.getVariable(node.id);
        if (funcRef.value.funcArgs.length !== node.args.length) {
            throw new SIMPLError (`Interpreting Error: Argumen pada TANYA ${funcRef.value.funcArgs.length < node.args.length 
                ? "kelebihan" : "kekurangan"} terhadap modul ${node.id}`);
        }

        let computedArgs = node.args.map((expression)=>this.visit(expression));
        this.createFunctionEnvironment(node.id, computedArgs);
        try {
            let func = this.getVariable(node.id).value;
            for (let child of func.funcNodes) {
                this.visit(child);
            }
        } catch (err) {
            if (err instanceof Jawaban) {
                this.leaveEnvironment();
                return err.value;
            } else throw err;
        }
        this.leaveEnvironment();

    }

    visitJawab (node) {
        throw new Jawaban(this.visit(node.expression));
    }

    visitHenti () {
        throw new Hentikan("Runtime Error: Tidak ada loop untuk dihentikan");
    }

    visitLewat () {
        throw new Lewatkan("Runtime Error: Tidak ada loop untuk dilewatkan");
    }

    visitSlagiClause (node) {
        while (this.visit(node.expression)) {
            try {
                this.visit(node.block);
            } catch (err) {
                if (err instanceof Hentikan) break;
                else if (err instanceof Lewatkan) continue;
                else throw err
            }
        }
    }

    visitSampeClause (node) {
        while (!this.visit(node.expression)) {
            try {
                this.visit(node.block);
            } catch (err) {
                if (err instanceof Hentikan) break;
                else if (err instanceof Lewatkan) continue;
                else throw err;
            }
        }
    }

    visitBlock (node) {
        for (let child of node.statements.children) this.visit(child);
    }

    visitKasusClause (node) {
        for (let kalau of node.kasusList) {
            if (this.visit(kalau.expression)) { this.visit(kalau); break; }
        }
    }

    visitKalauClause (node) {
        if (this.visit(node.expression)) {
            this.visit(node.block);
        }
    }

    visitRubahVariable (node) {
        this.changeVariable(node.id, this.visit(node.value));
    }

    visitVariable (node) {
        return this.getVariable(node.id).value;
    }

    visitVariableDecl (node) {
        this.generateVariable(node.id, this.visit(node.right));
    }

    visitBinOp (node) {
        switch (node.op.type) {
            case PLUS:
                return this.visit(node.left) + this.visit(node.right);
            case MINUS:
                return this.visit(node.left) - this.visit(node.right);
            case KALI:
                return this.visit(node.left) * this.visit(node.right);
            case BAGI:
                return this.visit(node.left) / this.visit(node.right);
            case AMPERSAN:
                return Boolean(this.visit(node.left) && this.visit(node.right)) ? 1 : 0;
            case PIPA:
                return Boolean(this.visit(node.left) || this.visit(node.right)) ? 1 : 0;
            case LEBIH:
                return (this.visit(node.left) > this.visit(node.right)) ? 1 : 0;
            case LEBIH_SAMA:
                return (this.visit(node.left) >= this.visit(node.right)) ? 1 : 0;
            case KURANG:
                return (this.visit(node.left) < this.visit(node.right)) ? 1 : 0;
            case KURANG_SAMA:
                return (this.visit(node.left) <= this.visit(node.right)) ? 1 : 0;
            case SAMA_SAMA:
                return (this.visit(node.left) == this.visit(node.right)) ? 1 : 0;
            case TIDAK_SAMA:
                return (this.visit(node.left) >= this.visit(node.right)) ? 1 : 0;
        }
    }

    visitUnaryOp (node) {
        switch(node.op.type) {
            case PLUS:
                return this.visit(node.right);
            case MINUS:
                return - this.visit(node.right);
            case SERU:
                return (this.visit(node.right) === 0) ? 1 : 0;
        }
    }

    visitCetak (node) {
        if (node.expression instanceof Nihil) {
            this.outputStream += '\n';
        } else {
            let str = this.visit(node.expression) + ' '; 
            this.outputStream += str;
        }
    }

    visitNoOp (node) {}

    visitNumeric (node) {
        return node.value;
    }

    visitProgram (node) {
        for (let child of node.statements.children) {
            this.visit(child);
        }
    }

    interpret () {
        this.visit(this.tree);
    }
}

function main () {
    let text = `
    
    `;
    try {
        let lex = new Lexer(text);
        let parser = new Parser(lex);
        let interpreter = new Interpreter(parser);
        interpreter.interpret();
        console.log(interpreter.outputStream);
    } catch (err) {
        if (err instanceof SIMPLError) {
            console.log(err.message)
        } else throw err;
    }

}

export function interpretCode (text) {
    let result = "";
    try {
        let lex = new Lexer(text);
        let parser = new Parser(lex);
        let interpreter = new Interpreter(parser);
        interpreter.interpret();
        result += interpreter.outputStream;
    } catch (err) {
        if (err instanceof SIMPLError) {
            result += err.message;
        } else result = err.message;
    }
    return result;
}
