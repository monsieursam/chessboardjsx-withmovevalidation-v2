import React, { Component } from "react";
import PropTypes from "prop-types";
import firebase from 'firebase'
import Chess from "chess.js"; // import Chess from  "chess.js"(default) if recieving an error about new Chess() not being a constructor

import Chessboard from "chessboardjsx";

class HumanVsHuman extends Component {
  static propTypes = { children: PropTypes.func };

  state = {
    fenBefore: "",
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

  componentDidMount() {
    this.game = new Chess();
  }

  // keep clicked square style and remove hint squares
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

    this.savePosition(fenBefore, fen, from, to)
  };

  onSquareRightClick = square =>
    this.setState({
      squareStyles: { [square]: { backgroundColor: "deepPink" } }
    });

  savePosition = (fenBeforeAt, fenAt, from, to) => {
    const find = '/';
    const re = new RegExp(find, 'g');
    const fenBefore = fenBeforeAt.replace(re, '-')
    const fen = fenAt.replace(re, '-')
    const db = firebase.database().ref(`/played_move/${fenBefore}`);
    const ref = db.orderByChild('positionNext').equalTo(fen);
    ref.once("value", function(snapshot) {
      if (snapshot && snapshot.val()){
        console.log("true");
          snapshot.forEach(function(childSnapshot) {
          // key will be "ada" the first time and "alan" the second time
          const key = childSnapshot.key;


          // childData will be the actual contents of the child
          const childData = childSnapshot.val();
          
          console.log(childData.from)
          if(childData.from === from && childData.to === to) {
            snapshot.child(key).ref.update({value: childData.value + 1})
          } else {
            console.log("false");
            const fenReplace = fen.replace(re, '-')
            db.push().set({positionNext: fenReplace, value: 0, from, to})
          }
      });
          
    } else {
      console.log("false");
      const fenReplace = fen.replace(re, '-')
      db.push().set({positionNext: fenReplace, value: 0, from, to})
    }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });


  }


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

export default class WithMoveValidation extends Component {
  render() {
    return (
    <div>
      <HumanVsHuman>
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
      </HumanVsHuman>
    </div>
  );
  }
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
