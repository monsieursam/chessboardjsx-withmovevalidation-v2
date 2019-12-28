import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from 'react-router-dom'
import "./index.css";
import Demo from "./Demo";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(<BrowserRouter><Demo /></BrowserRouter>, document.getElementById("root"));
registerServiceWorker();
