import "./App.css";
import { Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { GameProvider } from "./context/GameContext";
import HomeScreen from "./views/HomeScreen";
import PlayScreen from "./views/PlayScreen";

function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <Routes>
          <Route path="/"     element={<HomeScreen />} />
          <Route path="/play" element={<PlayScreen />} />
        </Routes>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;
