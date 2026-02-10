import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Facility from "./pages/Facility";
import Claim from "./pages/Claim";

export default function App() {
  return (
    <>
      <div className="scanline" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/facility/*" element={<Facility />} />
        <Route path="/claim/:token" element={<Claim />} />
      </Routes>
    </>
  );
}
