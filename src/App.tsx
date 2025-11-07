import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "../src/layout/Header";

function App() {

  return (
   <Router>
    <Routes>
      <Route path='/' element={<Header/>}/>
    </Routes>
   </Router>
  );
}

export default App
