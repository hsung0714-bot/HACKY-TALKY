import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "../src/layout/Header";
import Load from "../src/loading/Load"
function App() {

  return (
   <Router>
    <Routes>
      <Route path='/' element={<Header/>}/>
    </Routes>
      <Load />
   </Router>
  );
}

export default App
