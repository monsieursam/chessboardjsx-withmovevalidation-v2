import React, { Component } from "react";
import { Link } from 'react-router-dom'

class Demo extends Component {
  render() {
    return (
      <div>
        <Link to='/robot'>Affronter le robot</Link><br/>
        <Link to='/solo'>1 vs 1 offline</Link>
      </div>
    );
  }
}

export default Demo;
