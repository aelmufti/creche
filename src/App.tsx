import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Methodologie } from "./pages/Methodologie";
import { Confidentialite, MentionsLegales } from "./pages/Legal";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/methodologie" element={<Methodologie />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
