import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Curriculum from "./pages/Curriculum";
import Materials from "./pages/Materials";
import Login from "./pages/Login";
import Builder from "./pages/Builder";
import Landing from "./pages/admin/Landing";
import ClassPage from "./pages/admin/ClassPage";
import StudentPage from "./pages/admin/StudentPage";
import ReportPage from "./pages/admin/ReportPage";
import SheetPage from "./pages/admin/SheetPage";
import FeesPage from "./pages/admin/FeesPage";
import ContentPage from "./pages/admin/ContentPage";
import AccessPage from "./pages/admin/AccessPage";
import PromotionPage from "./pages/admin/PromotionPage";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/login" element={<Login />} />
        <Route path="/builder" element={<Builder />} />

        <Route path="/admin" element={<Landing />} />
        <Route path="/admin/class/:cls" element={<ClassPage />} />
        <Route path="/admin/student/:id" element={<StudentPage />} />
        <Route path="/admin/report/:id" element={<ReportPage />} />
        <Route path="/admin/sheet/:cls" element={<SheetPage />} />
        <Route path="/admin/fees" element={<FeesPage />} />
        <Route path="/admin/content" element={<ContentPage />} />
        <Route path="/admin/access" element={<AccessPage />} />
        <Route path="/admin/promotion" element={<PromotionPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
