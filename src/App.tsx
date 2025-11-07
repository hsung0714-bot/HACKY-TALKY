import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calendar from './page/main/Calendar';
import LookMap from './page/map/LookMap';
import Welcome from './page/main/Welcome';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>} />
        <Route path="/calendar" element={<Calendar/>} />
        <Route path="/lookmap/:id" element={<LookMap/>} />
      </Routes>
    </Router> 
  );
}

export default App;
