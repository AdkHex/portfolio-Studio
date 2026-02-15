import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import AdminPanel from "./admin/AdminPanel";
import StudioAuthPage from "./account/StudioAuthPage";
import StudioPage from "./account/StudioPage";
import StudioEditorPage from "./account/StudioEditorPage";
import StudioBillingCallbackPage from "./account/StudioBillingCallbackPage";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import RefundPage from "./pages/legal/RefundPage";
import AcceptableUsePage from "./pages/legal/AcceptableUsePage";

const adminPath = (import.meta.env.VITE_ADMIN_PATH || "/portal-x9a7m").replace(/^\/+/, "");

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/portfolio" element={<Index />} />
        <Route path="/s/:slug" element={<Index />} />
        <Route path="/studio/login" element={<StudioAuthPage mode="login" />} />
        <Route path="/studio/signup" element={<StudioAuthPage mode="signup" />} />
        <Route path="/studio/billing/callback" element={<StudioBillingCallbackPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/studio/editor/:siteId" element={<StudioEditorPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/refund" element={<RefundPage />} />
        <Route path="/legal/acceptable-use" element={<AcceptableUsePage />} />
        <Route path={`/${adminPath}`} element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
