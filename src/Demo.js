import React, { Component } from "react";
import firebase from 'firebase'
import { Route } from 'react-router-dom'

import WithMoveValidation from "./integrations/WithMoveValidation";
import RobotChess from "./integrations/robotChess";
import FightAgainstRobot from "./integrations/fightAgainstRobot";

import HomePage from './HomePage'

var firebaseConfig = {
    apiKey: "AIzaSyCXaJQxPrICjL7TwP4rd4bBwFyDFSk9-dY",
    authDomain: "chess-1ac65.firebaseapp.com",
    databaseURL: "https://chess-1ac65.firebaseio.com",
    projectId: "chess-1ac65",
    storageBucket: "chess-1ac65.appspot.com",
    messagingSenderId: "620715146551",
    appId: "1:620715146551:web:92f246af409454293e6eb2"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

class Demo extends Component {
  render() {
    return (
      <div>
        <div style={boardsContainer}>
          <Route exact path='/' render={() => <HomePage />} />
          <Route exact path='/robot' render={() => <RobotChess />} />
          <Route exact path='/solo' render={() => <WithMoveValidation />} />
          <Route exact path='/robotvsme' render={() => <FightAgainstRobot />} />
        </div>
      </div>
    );
  }
}

export default Demo;

const boardsContainer = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  flexWrap: "wrap",
  width: "100vw",
  marginTop: 30,
  marginBottom: 50
};
