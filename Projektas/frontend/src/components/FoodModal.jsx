import { Save } from "lucide-react";
import { Modal } from "./Modal.jsx";

// Maisto kurimo/redagavimo forma. Jei paduotas food - redaguojamas esamas, jei ne - kuriamas naujas.
export default function FoodModal({ food, onClose, onSubmit }) {
  return (
    <Modal title={food ? "Redaguoti maistą" : "Pridėti naują maistą"} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid">
        <label>Maisto pavadinimas<input name="name" placeholder="Pvz. Varškė" defaultValue={food?.name || ""} required /></label>
        <label>Kalorijos / 100 g<input name="caloriesPer100g" type="number" step="0.1" min="0" defaultValue={food?.caloriesPer100g ?? ""} required /></label>
        <label>Baltymai / 100 g<input name="proteinPer100g" type="number" step="0.1" min="0" defaultValue={food?.proteinPer100g ?? 0} /></label>
        <label>Angliavandeniai / 100 g<input name="carbsPer100g" type="number" step="0.1" min="0" defaultValue={food?.carbsPer100g ?? 0} /></label>
        <label>Riebalai / 100 g<input name="fatPer100g" type="number" step="0.1" min="0" defaultValue={food?.fatPer100g ?? 0} /></label>
        <div className="modal-actions wide">
          <button type="button" className="secondary" onClick={onClose}>Atšaukti</button>
          <button><Save size={18} /> Išsaugoti maistą</button>
        </div>
      </form>
    </Modal>
  );
}
