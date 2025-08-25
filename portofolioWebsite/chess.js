const startButton = document.getElementById('start-btn');
const boardContainer = document.getElementById('board-container');
const promoteContainer = document.getElementById('promote-container');
const promotion = document.getElementById("chess-promotion");

let isPlacing = false;
let canInput = true;
let pickedUpPiece = "";
let pickedUpCoordinates = [0,0];
let inverted = false;
export let mode = "";

export const Chess = {
    halt: false,
    chessBoard: [],
    validMoves: [],
    boardOrientation: ["b", "w"],
    dangerZone : {
        //WHITE KING CANT MOVE INSIDE dangerZone["w"];
        "w": [],
        //BLACK KING CANT MOVE INSIDE dangerZone["b"];
        "b": [],
        update: (toColor) => {
            //MOVESTREAM WILL BE USED HERE, MAKE SURE IT'S NOT USED ELSEWHERE;
            Chess.moveStream = [];
            Chess.dangerZone[toColor] = [];
            Chess.danger = true;
            Chess.chessBoard.forEach((row, ind) => row.forEach((value, jnd) =>{
                if (value[0] === Chess.colorInvert(toColor)) {
                    Chess.searchMove(ind, jnd, "movestream");
                }
            }));
            Chess.danger = false;
            Chess.dangerZone[toColor] = Chess.moveStream.map(arr => arr.slice());
            Chess.moveStream = [];
        },
        updateAll: () => {
            Chess.dangerZone.update("w");
            Chess.dangerZone.update("b");
        }
    },
    moveStream: [],
    castlingMoves: [],
    castlingPermit: ["wK", "wR0", "wR7", "bK", "bR0", "bR7"],
    enPassantPermit: [],
    enPassantMove: [],
    wantsToPromote: false,
    promotedPawn: [],
    danger: false,
    checked: " ",
    turn: "w",
    hashPositions: [],
    init: (player =  "w") => {
        Chess.initChessBoard(player);
        Chess.moveStream = [];
        Chess.castlingMoves = [];
        Chess.castlingPermit = ["wK", "wR0", "wR7", "bK", "bR0", "bR7"];
        Chess.danger =  false;
        Chess.checked = " ";
        Chess.enPassantPermit = [];
        Chess.enPassantMove = [];
        Chess.dangerZone.updateAll();
        Chess.wantsToPromote = false;
        Chess.promotedPawn = [];
        Chess.turn = "w";
        Chess.hashPositions = [];
        Chess.checkIfThreefold();
        Chess.halt = false;
    },
    initChessBoard: (mode = "w") => {
        if (mode === "w") {
            Chess.boardOrientation = ["b","w"];
            Chess.chessBoard = [
                ["bR","bN","bB","bQ","bK","bB","bN","bR"],
                ["bP","bP","bP","bP","bP","bP","bP","bP"],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["wP","wP","wP","wP","wP","wP","wP","wP"],
                ["wR","wN","wB","wQ","wK","wB","wN","wR"]
            ]
        } else if (mode === "b"){
            Chess.boardOrientation = ["w", "b"];
            Chess.chessBoard = [
                ["wR","wN","wB","wK","wQ","wB","wN","wR"],
                ["wP","wP","wP","wP","wP","wP","wP","wP"],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["bP","bP","bP","bP","bP","bP","bP","bP"],
                ["bR","bN","bB","bK","bQ","bB","bN","bR"],
            ]
        } else {
            Chess.boardOrientation = ["b", "w"];
            Chess.chessBoard =[
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","  ","  ","  "],
                ["  ","  ","  ","  ","bQ","  ","  ","  "],
                ["  ","  ","  ","  ","  ","bK","  ","  "],
                ["  ","  ","  ","  ","  ","  ","bN","  "],
                ["  ","  ","  ","  ","  ","  ","wK","wR"]
            ]
        }
    },
    colorInvert: (color) => {
        if (color === " ") return " ";
        return color === "b" ? "w" : "b";
    },
    rayMachine: (i, j, dir, length = 8) => {
        let color = Chess.chessBoard[i][j][0];
        let iAdd = 0;
        let jAdd = 0;
        switch (dir) {
            case "up":
                iAdd = -1;
                break;
            case "down":
                iAdd = 1;
                break;
            case "right":
                jAdd = 1;
                break;
            case "left":
                jAdd = -1;
                break;
            case "straight":
                Chess.rayMachine(i, j, "up", length);
                Chess.rayMachine(i, j, "down", length);
                Chess.rayMachine(i, j, "right", length);
                Chess.rayMachine(i, j, "left", length);
                return;
            case "up-left":
                iAdd = -1;
                jAdd = -1;
                break;
            case "down-left":
                iAdd = 1;
                jAdd = -1;
                break;
            case "up-right":
                iAdd = -1;
                jAdd = 1;
                break;
            case "down-right":
                iAdd = 1;
                jAdd = 1;
                break;
            case "diagonal":
                Chess.rayMachine(i, j, "up-left", length);
                Chess.rayMachine(i, j, "down-left", length);
                Chess.rayMachine(i, j, "up-right", length);
                Chess.rayMachine(i, j, "down-right", length);
                return;
            case "all":
                Chess.rayMachine(i, j, "straight", length);
                Chess.rayMachine(i, j, "diagonal", length);
                return;
            default:
                alert("invalid dir");
                return;
        }
        for (let ray = 1; ray <= length; ray++) {
            let valid = () => 
                (iAdd !== 0 || jAdd !== 0) &&
                (i + iAdd*ray >= 0 && j + jAdd*ray >= 0) &&
                (Chess.chessBoard.length > i + iAdd*ray && Chess.chessBoard.length > j + jAdd*ray);

            if (valid()) {
                if (Chess.chessBoard[i + iAdd*ray][j + jAdd*ray][0] === color){
                    if (Chess.danger)
                        Chess.moveStream.push([i + iAdd*ray, j + jAdd*ray]);
                    return;
                }
                else if (Chess.chessBoard[i + iAdd*ray][j + jAdd*ray][0] === Chess.colorInvert(color)) {
                    Chess.moveStream.push([i + iAdd*ray, j + jAdd*ray]);
                    if (Chess.chessBoard[i + iAdd*ray][j + jAdd*ray] === Chess.colorInvert(color) + "K" && Chess.danger){
                        ray++;
                        if (valid())
                            Chess.moveStream.push([i + iAdd*ray, j + jAdd*ray]);
                    }
                    return;
                } else {
                    Chess.moveStream.push([i + iAdd*ray, j + jAdd*ray]);
                }
            } else return;
        }
    },
    pawn: (i, j) => {
        const color = Chess.chessBoard[i][j][0];
        const direction = color === Chess.boardOrientation[0] ? 1 : -1;
        const startingPos = color === Chess.boardOrientation[0] ? 1 : 6;
        const spaceExists = (iAdd, jAdd) => {
            return (i + iAdd >= 0 && j + jAdd >= 0) && (Chess.chessBoard.length > i + iAdd && Chess.chessBoard.length > j + jAdd);
        };
        const move = (iAdd, jAdd) => {
            if (spaceExists(iAdd, jAdd) && Chess.chessBoard[i+iAdd][j+jAdd][0] ===  " " && !Chess.danger) {
                Chess.moveStream.push([i+iAdd, j+jAdd]);
                return true;
            }
            return false;
        };
        const attack = (iAdd, jAdd) => {
            const target = [i+iAdd, j+jAdd];
            if (spaceExists(iAdd, jAdd) && 
                (Chess.chessBoard[i+iAdd][j+jAdd][0] === Chess.colorInvert(color) || 
                 Chess.danger || 
                 (Chess.enPassantMove.every((value, index) => value === target[index]) && Chess.enPassantMove.length !== 0 && Chess.turn === color)))
                Chess.moveStream.push([i+iAdd, j+jAdd]);
        };
        if (move(1*direction, 0) && i === startingPos) {
            if (move(2*direction, 0)) {
                Chess.enPassantPermit = [i+2*direction, j];
            }
        }
        attack(1*direction, -1);
        attack(1*direction, 1);
    },
    king: (i, j) => {
        Chess.rayMachine(i, j, "all",1);
        if (Chess.danger) return;
        //danger doesnt need castling info;
        const piece = Chess.chessBoard[i][j];
        const startingPos = piece[0] === Chess.boardOrientation[0] ? 0 : 7;
        if (i !== startingPos || j !== (startingPos === 0 ? 5 : 4)) return;

        const isCastleValid = (coordinates) => {
            const result = !Chess.dangerZone[piece[0]].some(arr => arr.every((value, index) => value === coordinates[index])) &&
            Chess.chessBoard[coordinates[0]][coordinates[1]] === "  ";
            return result;
        };
        if (Chess.castlingPermit.includes(piece[0] + "K") && Chess.checked !== piece[0]) {
            const kingSide = Chess.boardOrientation[0] === "b" ? [5, 6, 7] : [2, 1, 0];
            const queenSide = Chess.boardOrientation[0] === "b" ? [1, 2, 3, 0] : [6, 5, 4, 7];
            const rookValid = function(name, whereJ) {
                const whereI = Chess.boardOrientation[0] === "b" ? (name[0] === "w" ? 7 : 0) : (name[0] === "w" ? 0 : 7);
                return Chess.castlingPermit.includes(name + String(whereJ)) && 
                    Chess.chessBoard[whereI][whereJ] === name;
            };
            const kingSideValid = function() {
                return isCastleValid([startingPos, kingSide[0]]) && isCastleValid([startingPos, kingSide[1]]);
            };
            const queenSideValid = function() {
                return isCastleValid([startingPos, queenSide[0]]) && isCastleValid([startingPos, queenSide[1]]) &&
                    isCastleValid([startingPos, queenSide[2]]);
            }
            if (queenSideValid() && 
                ((rookValid(piece[0] + "R", 0) && Chess.boardOrientation[0] === "b") ||
                (rookValid(piece[0] + "R", 7) && Chess.boardOrientation[0] === "w"))) {
                    Chess.castlingMoves.push([piece, [startingPos, queenSide[1]], [startingPos, queenSide[3], queenSide[2]]])
            }
            if (kingSideValid() &&
                ((rookValid(piece[0] + "R", 7) && Chess.boardOrientation[0] === "b") ||
                (rookValid(piece[0] + "R", 0) && Chess.boardOrientation[0] === "w"))) {
                    Chess.castlingMoves.push([piece, [startingPos, kingSide[1]], [startingPos, kingSide[2], kingSide[0]]])
            }
        }
    },
    queen: (i, j) => {
        Chess.rayMachine(i, j, "all");
    },
    rook: (i, j) => {
        Chess.rayMachine(i, j, "straight");
    },
    bishop: (i, j) => {
        Chess.rayMachine(i, j, "diagonal");
    },
    knight: (i, j) => {
        const color = Chess.chessBoard[i][j][0];
        const spaceExists = (iAdd, jAdd) => {
            return (i + iAdd >= 0 && j + jAdd >= 0) && (Chess.chessBoard.length > i + iAdd && Chess.chessBoard.length > j + jAdd);
        };
        const add = (iAdd, jAdd) => {
            if (spaceExists(iAdd, jAdd)) {
                if(Chess.chessBoard[i+iAdd][j+jAdd][0] !== color || (Chess.chessBoard[i+iAdd][j+jAdd][0] === color && Chess.danger))
                    Chess.moveStream.push([i+iAdd, j+jAdd]);
            }
        }
        add(-1, 2);add(1, 2);add(1, -2);add(-1, -2);
        add(2, -1);add(-2, 1);add(2, 1);add(-2, -1);
    },
    searchMove: (i, j, toWhere = "valid") => {
        if (toWhere === "valid") Chess.castlingMoves = [];
        const piece = Chess.chessBoard[i][j];
        switch(piece[1]) {
            case "P": 
                Chess.pawn(i,j);
                break;
            case "K": 
                Chess.king(i,j);
                break;
            case "Q": 
                Chess.queen(i,j);
                break;
            case "R": 
                Chess.rook(i,j);
                break;
            case "B": 
                Chess.bishop(i,j);
                break;
            case "N": 
                Chess.knight(i, j);
                break;
            default:
                alert("function not found: " + piece);
                return;
        }
        if (toWhere !== "movestream") {
            //gotta copy and clear the movestream because dangerzone.update uses movestream;
            let tempMoves = Chess.moveStream.map(arr => arr.slice());
            Chess.moveStream = [];
            tempMoves = tempMoves.filter(arr => {
                let save = Chess.simulateMove([i,j], arr);
                Chess.dangerZone.updateAll();
                let result = Chess.checkIfChecked(piece[0]);
                Chess.simulateMove(arr, [i, j], save);
                if (result !== piece[0]) return arr;
            });
            Chess.dangerZone.updateAll();
            if (toWhere === "checkifstuck")
                Chess.moveStream = tempMoves.map(arr => arr.slice());
            else if (toWhere === "valid") {
                //castling decides if its own move is safe or not, so we dont check for checked conditions in previous
                Chess.castlingMoves.forEach(arr => {
                    if (arr[0] === piece) tempMoves.push(arr[1]);
                })
                Chess.validMoves = tempMoves.map(arr => arr.slice());
            }
        }
    },
    simulateMove: (from, to, fill = "  ") => {
        const save = Chess.chessBoard[to[0]][to[1]];
        [Chess.chessBoard[from[0]][from[1]],Chess.chessBoard[to[0]][to[1]]] = [fill,Chess.chessBoard[from[0]][from[1]]];
        return save;
    },
    searchKing: (color) => {
        for(const row in Chess.chessBoard) {
            for(const col in Chess.chessBoard[row]) {
                if (Chess.chessBoard[row][col] === color + "K") return [Number(row), Number(col)];
            }
        }
    },
    checkIfChecked: (color) => {
        const c = Chess.searchKing(color);
        return Chess.dangerZone[color].some(arr => arr.every((value, index) => value === c[index])) ? color : " ";
    },
    checkIfNoValidMove: (color) => {
        let remainingMoves = 0;
        Chess.chessBoard.forEach((row, ind) => row.forEach((value, jnd) =>{
            if (value[0] === color) {
                Chess.searchMove(ind, jnd, "checkifstuck");
                remainingMoves += Chess.moveStream.length;
                Chess.moveStream = [];
            }
        }));
        return remainingMoves === 0 ? true : false;
    },
    checkIfStalemate: () => {
        if (Chess.checked !== " ") return false;
        
        //is NOT CHECKED but has no valid moves STALEMATE
        const whiteNotValid = Chess.checkIfNoValidMove("w");
        const blackNotValid = Chess.checkIfNoValidMove("b");
        if (whiteNotValid || blackNotValid) return true;

        // Both CAN move but we check the pieces for INSUFFICIENT MATERIAL ie. one knight or one bishop
        const whitePieces = {"B": 0, "N": 0, "K": 0};
        const blackPieces = {"B": 0, "N": 0, "K": 0};
        const stillHasPieces = [false, false];
        for (const row of Chess.chessBoard) {
            for (const value of row) {
                if (value[0] === "w") {
                    if (["R", "Q", "P"].includes(value[1])) stillHasPieces[0] = true;
                    else whitePieces[value[1]]++;
                } else if (value[0] === "b") {
                    if (["R", "Q", "P"].includes(value[1])) stillHasPieces[1] = true;
                    else blackPieces[value[1]]++;
                }
            }
        }
        if (stillHasPieces[0] || stillHasPieces[1]) return false;
        if ((whitePieces["B"] > 1 || blackPieces["B"] > 1) || 
            (whitePieces["N"] > 1 || blackPieces["N"] > 1) || 
            (whitePieces["N"] === 1 && whitePieces["B"] === 1) ||
            (blackPieces["N"] === 1 && blackPieces["B"] === 1))
            return false;

        return true;
    },
    checkIfThreefold: () => {
        //I copypasted this, idk how this work, but it does
        const simpleHash = str => {
            let hash = 0;
            for (let i = 0; i<str.length; i++) {
                const char = str.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0;
            }
            return hash;
        };

        // Based on FIDE rules, threefold draw *could* happens when the same POSITIONS occured three times over the course of the game.
        // The same POSITION means the pieces are in the same location so valid attack moves are the same (including en passant)
        // They don't need to happen consecutively
        // Castling rights are also considered.
        // If pieces are in the same exact locations but castling rights are revoked, then its NOT the same POSITION

        let boardString = "";
        for (const row of Chess.chessBoard) {
            for (const item of row) boardString += item;
        }
        for (const item of Chess.castlingPermit) boardString+=item;
        if (Chess.enPassantMove.length !== 0) boardString += Chess.enPassantMove[0].toString() + Chess.enPassantMove[1].toString;
        
        boardString = simpleHash(boardString);

        let counter = 0;
        for (const item of Chess.hashPositions) {
            if (item === boardString) counter++;
        }

        if (counter == 2) 
            return true;
        else {
            Chess.hashPositions.push(boardString);
            return false;
        }
    },
    doSpecialMove: (from, to) => {
        let result = false;
        const piece = Chess.chessBoard[from[0]][from[1]];
        switch (piece[1]) {
            case "K":
                Chess.castlingMoves.forEach(arr => {
                    if (arr[0] === piece && arr[1].every((val, ind) => val === to[ind])) {
                        [Chess.chessBoard[to[0]][to[1]], Chess.chessBoard[from[0]][from[1]]] = [piece, "  "];
                        [Chess.chessBoard[arr[2][0]][arr[2][2]], Chess.chessBoard[arr[2][0]][arr[2][1]]] = [piece[0] + "R", "  "];
                        result = "castled";
                    }
                });
                const kingIndex = Chess.castlingPermit.indexOf(piece[0] + "K");
                if (kingIndex !== -1)
                    Chess.castlingPermit[kingIndex] = "  ";
                Chess.castlingMoves = [];
                break;

            case "P":
                const direction = from[0] > to[0] ? -1 : 1;
                //Check enPassant
                if (to.every((value, index) => value === Chess.enPassantPermit[index])) {
                    const back = to[0] + -direction;
                    Chess.enPassantMove = [back, to[1]];
                    Chess.enPassantPermit = [];
                    //this needs the early return so enPassantMove is not cleared right away
                    return false;
                } else if (to.every((value, index) => value === Chess.enPassantMove[index])) {
                    const front = Chess.enPassantMove[0] + -direction;
                    Chess.chessBoard[front][to[1]] = "   ";
                    result = "enpassant";
                } else result = false;

                //Check promotion
                if (to[0] === (direction > 0 ? 7 : 0)) {
                    Chess.wantsToPromote = true;
                    Chess.mode = "promotion";
                    Chess.halt = true;
                    Chess.promotedPawn = to;
                    result = "promotion";
                }
                break;
            
            case "R":
                const rookIndex = Chess.castlingPermit.indexOf(piece + String(from[1]))
                if (rookIndex !== -1)
                    Chess.castlingPermit[rookIndex] = "  ";
                result = false;
                break;
        }
        Chess.enPassantMove = [];
        Chess.enPassantPermit = [];
        Chess.castlingMoves = [];
        return result;
    },
    movePiece: (from, to, skipValid = false) => {
        const color = Chess.chessBoard[from[0]][from[1]][0];
        //Chess.searchValidMove(from[0], from[1], "valid");

        const moveIsValid = Chess.validMoves.some(arr => arr.every((value, index) => value === to[index]));

        if ((!moveIsValid || Chess.halt || Chess.turn !== color) && (!skipValid)) {
            Chess.validMoves = [];
            return false;
        }
        //do the move
        const result = Chess.doSpecialMove(from, to);
        if (result !== "castled")
            [Chess.chessBoard[to[0]][to[1]], Chess.chessBoard[from[0]][from[1]]] = [Chess.chessBoard[from[0]][from[1]], "  "];
        Chess.validMoves = [];
        //Update all dangerZones
        Chess.dangerZone.updateAll();
        //Checking if the last move was check to opponent;
        const opponentColor = Chess.colorInvert(color);
        Chess.checked = Chess.checkIfChecked(opponentColor);
        Chess.turn = opponentColor;
        //Check if game ends
        if (Chess.checkIfThreefold()) {
            console.log("Threefold draw");
            mode = "draw";
            Chess.halt = true;
        }
        else if (Chess.checked === opponentColor)
            if (Chess.checkIfNoValidMove(opponentColor)) {
                console.log("Checkmate", color, "wins");
                mode = "win: " + color == "w" ? "White": "Black";
                Chess.halt = true;
            } else {
                console.log("Check");
                mode = "check: " +  color == "w" ? "White" : "Black";
            }
        else if (Chess.checkIfStalemate()) {
            console.log("Game draw");
            mode = "draw";
            Chess.halt = true;
        }
        return true;
    },
    promotePawn: (to) => {
        Chess.wantsToPromote = false;
        Chess.halt = false;
        const color = Chess.chessBoard[Chess.promotedPawn[0]][Chess.promotedPawn[1]][0];
        Chess.chessBoard[Chess.promotedPawn[0]][Chess.promotedPawn[1]] = color + to;
    }

};

function textureTile (toWhat) {
    if (toWhat[0] === "w") {
        return `/textures/${toWhat}.png`;
    } else if (toWhat[0] === "b") {
        return `/textures/${toWhat}.png`;
    } else {
        return `/textures/No.png`;
    }
}

function boardColorPicker (i,j) {
    return (i % 2) ? (j % 2 ? "white-tile" : "black-tile") : (j % 2 ? "black-tile" : "white-tile");
}

function highlightTile (i, j, mode = "") {
    if (inverted) {
        i = 7 - i;
        j = 7 - j;
    }
    const tile = document.getElementById(`tile-${i}-${j}`);
    if (mode === "self")
        tile.classList.add('highlight-self'); 
    else if (mode === "tile")
        tile.classList.add('highlight-tile');
    else {
        tile.classList.remove('highlight-self');
        tile.classList.remove('highlight-tile');
    }
}

function highlightValidMoves() {
    for (const spot in Chess.validMoves)
        highlightTile(Chess.validMoves[spot][0], Chess.validMoves[spot][1], "tile");
}

function unhighlightAll() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            highlightTile(i, j, "remove");
        }
    }
}

export function initGame() {
    Chess.init("w");
    isPlacing = false;
    canInput = true;
    updateTileAll();
    unhighlightAll();
}

function pickUp (i, j) {
    isPlacing = true;
    pickedUpPiece = Chess.chessBoard[i][j];
    pickedUpCoordinates = [i, j];
    highlightTile(i, j, "self");
    Chess.searchMove(i, j);
    highlightValidMoves();
}

function placeDown (i, j) {
    const c = pickedUpCoordinates;
    const target = [i,j];
    Chess.movePiece(c, target);
    if (Chess.wantsToPromote) {
        promotion.style.display = "grid";
        canInput = false;
    }
    updateTileAll();
    unhighlightAll();
    highlightTile(c[0], c[1], "remove");
    isPlacing = false;
}

export function tileClick(i, j) {
    if (inverted) {
        i = 7 - i;
        j = 7 - j;
    }
    if (canInput && !isPlacing) {
        if (Chess.chessBoard[i][j] !== "  ")
            pickUp(i, j);
    } else if (canInput && isPlacing) {
        placeDown(i, j);
    }
    
}

export function promoteClick(what) {
    if (Chess.wantsToPromote) {
        canInput = true;
        if (Chess.wantsToPromote)
            Chess.promotePawn(what);
        promotion.style.display = "none";
        updateTileAll();
    }
}

function updateTileAll () {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (!inverted) {
                const tile = document.getElementById(`tile-${i}-${j}`);
                tile.firstElementChild.setAttribute("src", textureTile(Chess.chessBoard[i][j]));
            } else {
                const tile = document.getElementById(`tile-${i}-${j}`);
                tile.firstElementChild.setAttribute("src", textureTile(Chess.chessBoard[7-i][7-j]));
            }
        }
    }
}
