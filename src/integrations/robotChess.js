import React, { Component } from "react";
import PropTypes from "prop-types";
import firebase from 'firebase'
import Chess from "chess.js"; // import Chess from  "chess.js"(default) if recieving an error about new Chess not being a constructor

import Chessboard from "chessboardjsx";

class RandomVsRandom extends Component {
  static propTypes = { children: PropTypes.func };

  state = {
    fenBefore: "",
    diff: "",
    diff2: "",
    fenNext: "",
    fen: "start",
    // square styles for active drop square
    dropSquareStyle: {},
    // custom square styles
    squareStyles: {},
    // square with the currently clicked piece
    pieceSquare: "",
    // currently clicked square
    square: "",
    // array of past game moves
    history: []
  };

  constructor(props){
    super(props)
    
    
    this.PLAYER_ID = 'robot'
    this.PLAYER_ID2 = 'robot2'
    this.WHO_BEGIN = Math.floor(Math.random() * 2) + 1

    const db = firebase.database().ref(`/games/`);
    const ref = db.push()

    if(this.WHO_BEGIN === 1) {
      this.BLACK = this.PLAYER_ID
      this.WHITE = this.PLAYER_ID2
      
      ref.set({white: this.PLAYER_ID2, black: this.PLAYER_ID})
    } else {
      this.WHITE = this.PLAYER_ID
      this.BLACK = this.PLAYER_ID2
      ref.set({black: this.PLAYER_ID2, white: this.PLAYER_ID2})
    }

    this.UNIQUE_ID = ref.key

    
  }

  componentDidMount() {
    this.game = new Chess();

    // this.makeRandomMove()
    
    var myInterval = setInterval(
      () => {
        let possibleMoves = this.game.moves();
      if (
        this.game.game_over() === true ||
        this.game.in_draw() === true ||
        possibleMoves.length === 0
      ) {
        this.winGame()
        clearInterval(myInterval);
      } else {
        this.makeMove(true)
      }
      },
      50
    );

    setTimeout(
      () => {
        this.drawGame()
        setTimeout(
          () => window.location.reload(), 1000
        )
      },
      30000
    )
    
  }

  winGame = () => {
    if(this.game.in_checkmate()) {
    console.log("roooooh echec et math bg")
    
    let colorWinnerId
        if(this.game.turn() === 'b') {
          colorWinnerId = this.WHITE
        } else {
          colorWinnerId = this.BLACK
        }

        const dba = firebase.database().ref(`/games/${this.UNIQUE_ID}/played_move/`);

        dba.once("value", function(snapshot) {
          if (snapshot && snapshot.val()){
            console.log("true");
            snapshot.forEach(childSnapshot => {
              const key = childSnapshot.key;
              const childData = childSnapshot.val();
              const db = firebase.database().ref(`/played_move/${childData.fen}`); 
              db.once("value", function(snapshot2) {
                if (snapshot2 && snapshot2.val()){
                  snapshot2.forEach(childSnapshot2 => {
                    const childData2 = childSnapshot2.val();
                    const dbupdate = firebase.database().ref(`/played_move/${childData.fen}/${childData.idMove}/`);
                    if(childData.player === colorWinnerId) {
                      dbupdate.update({win: childData2.win ? childData2.win + 1 : 1 })
                    } else {
                      dbupdate.update({lose: childData2.lose ? childData2.lose + 1 : 1 })
                    }
                })
              }
              }, function (errorObject) {
                  console.log("The read failed: " + errorObject.code);
              });
            
          });
        }
        setTimeout(
          () => window.location.reload(), 1000
        )
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
      }
  }

  drawGame = () => {
    const dba = firebase.database().ref(`/games/${this.UNIQUE_ID}/played_move/`);

        dba.once("value", function(snapshot) {
          if (snapshot && snapshot.val()){
            console.log("true");
            snapshot.forEach(childSnapshot => {
              const key = childSnapshot.key;
              const childData = childSnapshot.val();
              const db = firebase.database().ref(`/played_move/${childData.fen}`); 
              db.once("value", function(snapshot2) {
                if (snapshot2 && snapshot2.val()){
                  snapshot2.forEach(childSnapshot2 => {
                    const childData2 = childSnapshot2.val();
                    const dbupdate = firebase.database().ref(`/played_move/${childData.fen}/${childData.idMove}/`);
                    dbupdate.update({draw: childData2.draw ? childData2.draw + 1 : 1 })
                    
                })
              }
              }, function (errorObject) {
                  console.log("The read failed: " + errorObject.code);
              });
            
          });
        }
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        })
        
      
  }

  componentDidUpdate(prevProps) {
    if (this.state.diff !== this.state.fenBefore) {
      // this.makeMove()
      this.setState({ diff: this.state.fenBefore})
    }
  }

  removeHighlightSquare = () => {
    this.setState(({ pieceSquare, history }) => ({
      squareStyles: squareStyling({ pieceSquare, history })
    }));
  };

  // show possible moves
  highlightSquare = (sourceSquare, squaresToHighlight) => {
    const highlightStyles = [sourceSquare, ...squaresToHighlight].reduce(
      (a, c) => {
        return {
          ...a,
          ...{
            [c]: {
              background:
                "radial-gradient(circle, #fffc00 36%, transparent 40%)",
              borderRadius: "50%"
            }
          },
          ...squareStyling({
            history: this.state.history,
            pieceSquare: this.state.pieceSquare
          })
        };
      },
      {}
    );

    this.setState(({ squareStyles }) => ({
      squareStyles: { ...squareStyles, ...highlightStyles }
    }));
  };

  onDrop = ({ sourceSquare, targetSquare }) => {
    // see if the move is legal
    let move = this.game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q" // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return;
    const fen = this.state.fen
    this.setState(({ history, pieceSquare }) => ({
      fenBefore: fen,
      fen: this.game.fen(),
      history: this.game.history({ verbose: true }),
      squareStyles: squareStyling({ pieceSquare, history })
    }));
  };

  onMouseOverSquare = square => {
    // get list of possible moves for this square
    let moves = this.game.moves({
      square: square,
      verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    let squaresToHighlight = [];
    for (var i = 0; i < moves.length; i++) {
      squaresToHighlight.push(moves[i].to);
    }

    this.highlightSquare(square, squaresToHighlight);
  };

  onMouseOutSquare = square => this.removeHighlightSquare(square);

  // central squares get diff dropSquareStyles
  onDragOverSquare = square => {
    this.setState({
      dropSquareStyle:
        square === "e4" || square === "d4" || square === "e5" || square === "d5"
          ? { backgroundColor: "cornFlowerBlue" }
          : { boxShadow: "inset 0 0 1px 4px rgb(255, 255, 0)" }
    });
  };

  onSquareClick = square => {
    this.setState(({ history }) => ({
      squareStyles: squareStyling({ pieceSquare: square, history }),
      pieceSquare: square
    }));

    const from = this.state.pieceSquare
    const to = square

    let move = this.game.move({
      from,
      to,
      promotion: "q" // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return;

    const fenBefore = this.state.fen
    const fen = this.game.fen()

    this.setState({
      fenBefore,
      fen,
      history: this.game.history({ verbose: true }),
      pieceSquare: ""
    });

    this.savePosition(fenBefore, fen, from, to, this.PLAYER_ID)

    this.makeMove()
  };

  onSquareRightClick = square =>
    this.setState({
      squareStyles: { [square]: { backgroundColor: "deepPink" } }
    });

    savePosition = (fenBeforeAt, fenAt, from, to, player) => {
      console.log('I save position')
  
      const find = '/';
      const re = new RegExp(find, 'g');
      const fen = fenAt.replace(re, '-')
      const fenBefore = fenBeforeAt.replace(re, '-')
      const db = firebase.database().ref(`/played_move/${fenBefore}`);
      const dba = firebase.database().ref(`/games/${this.UNIQUE_ID}/played_move/`);
      let alreadyExist = false
      const ref = db.orderByChild('positionNext').equalTo(fen);
      ref.once("value", function(snapshot) {
        if (snapshot && snapshot.val()){
          console.log("true");
            snapshot.forEach(function(childSnapshot) {
            const key = childSnapshot.key;
            const childData = childSnapshot.val();
            
            console.log(childData)
            if(childData.from === from && childData.to === to && childData.positionNext === fen) {
              alreadyExist = true
              console.log("Le coup a déja été fait")
              snapshot.child(key).ref.update({value: childData.value + 1})
              dba.push().set({idMove: key, fen: fenBefore, player})
            }
  
        });
            
      } 
      if(!alreadyExist) {
        console.log("Personne n'a jamais fait ce coup");
        const refpush = db.push()
        refpush.set({positionNext: fen, value: 0, from, to})
  
        dba.push().set({idMove: refpush.key, fen: fenBefore, player})
      }
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
  
      
    }

  makeMove = (isPlayedAfter) => {
    

      
    console.log('A move will be done')
    const find = '/';
    const re = new RegExp(find, 'g');
    const fen = isPlayedAfter ? this.game.fen().replace(re, '-') : 'start'
    const db = firebase.database().ref(`/played_move/${fen}`);
    const ref = db.orderByChild('win').limitToFirst(1);
    let childData;
    ref.once("value", function(snapshot) {
      if (snapshot && snapshot.val()){
        console.log("true");
          snapshot.forEach(function(childSnapshot) {
          // key will be "ada" the first time and "alan" the second time
          const key = childSnapshot.key;


          // childData will be the actual contents of the child
          childData = childSnapshot.val();
          if(!childData.win && childData.lose && !childData.draw) {
            childData = null
          } else if(!childData.win && childData.draw && !childData.lose) {
            childData = null
          }
      });
        }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    }).then(() => {
      if(childData) {
        console.log(childData)
        const { from } = childData
        const { to } = childData

        console.log(from)
        console.log(to)
        let move = from ? this.game.move({from, to}) : this.game.move(to) 
        
        if (move === null) return;

        console.log('plop')
        const fenBefore = this.state.fen
        const fen = this.game.fen()
        this.setState({
          fenBefore,
          fen,
          history: this.game.history({ verbose: true }),
          pieceSquare: ""
        });

        // this.setState({fen: childData && childData.positionNext, fenBefore: fen})
        this.savePosition(fenBefore, fen, from, to, this.PLAYER_ID)
      } else {
        console.log("Not found a good move")
        this.makeRandomMove()
      }
      
    }) 
  
    
    
  }

  makeRandomMove = () => {
    let possibleMoves = this.game.moves();

    // exit if the game is over
    if (
      this.game.game_over() === true ||
      this.game.in_draw() === true ||
      possibleMoves.length === 0
    )
      return;

    let randomIndex = Math.floor(Math.random() * possibleMoves.length);

    console.log(possibleMoves)
    this.game.move(possibleMoves[randomIndex]);

    const fen = this.game.fen()

    this.savePosition(this.state.fen, fen, null, possibleMoves[randomIndex], this.PLAYER_ID)

    this.setState({ fen });
    
    // this.savePosition(this.state.fenBefore, fen , null, to)
  };

  render() {
    const { fen, dropSquareStyle, squareStyles } = this.state;

    return this.props.children({
      squareStyles,
      position: fen,
      onMouseOverSquare: this.onMouseOverSquare,
      onMouseOutSquare: this.onMouseOutSquare,
      onDrop: this.onDrop,
      dropSquareStyle,
      onDragOverSquare: this.onDragOverSquare,
      onSquareClick: this.onSquareClick,
      onSquareRightClick: this.onSquareRightClick,
      savePosition: this.savePosition
    });
  }
}

/* eslint react/display-name: 0 */
/* eslint react/prop-types: 0 */
export default function RandomVsRandomGame() {
  return (
    <div>
      <RandomVsRandom>
        {({
          position,
          onDrop,
          onMouseOverSquare,
          onMouseOutSquare,
          squareStyles,
          dropSquareStyle,
          onDragOverSquare,
          onSquareClick,
          onSquareRightClick,
          getPosition,
          savePosition
        }) => (<div>
          <Chessboard
            id="humanVsHuman"
            width={320}
            position={position}
            onDrop={onDrop}
            onMouseOverSquare={onMouseOverSquare}
            onMouseOutSquare={onMouseOutSquare}
            boardStyle={{
              borderRadius: "5px",
              boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`
            }}
            squareStyles={squareStyles}
            dropSquareStyle={dropSquareStyle}
            onDragOverSquare={onDragOverSquare}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
          />
          </div>
        )}
      </RandomVsRandom>
    </div>
  );
}

const squareStyling = ({ pieceSquare, history }) => {
  const sourceSquare = history.length && history[history.length - 1].from;
  const targetSquare = history.length && history[history.length - 1].to;

  return {
    [pieceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
    ...(history.length && {
      [sourceSquare]: {
        backgroundColor: "rgba(255, 255, 0, 0.4)"
      }
    }),
    ...(history.length && {
      [targetSquare]: {
        backgroundColor: "rgba(255, 255, 0, 0.4)"
      }
    })
  };
};
