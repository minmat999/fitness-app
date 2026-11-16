import { Leaf, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-brand"><Leaf size={18} /> Mitybos sekiklis</span>
        <span>T120B165 Saityno taikomųjų programų projektavimas · KTU 2026</span>
        <span className="footer-made">Sukurta su <Heart size={14} /> sveikesnei mitybai</span>
      </div>
    </footer>
  );
}
