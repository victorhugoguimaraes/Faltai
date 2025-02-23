import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function AddSubjectModal({ open, onClose, onSave }) {
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("");
  const [dailyClasses, setDailyClasses] = useState("");

  const handleSave = () => {
    if (!subject || !hours || !dailyClasses || subject.trim() === "") {
      alert("Preencha todos os campos corretamente!");
      return;
    }
    onSave({ subject: subject.trim(), hours, dailyClasses });
    onClose();
  };
  

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle className="text-xl font-semibold">Adicionar Matéria</DialogTitle>
      <DialogContent className="p-4 flex flex-col gap-4">
        <Input label="Nome da Matéria" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Select label="Carga Horária Total" value={hours} onChange={setHours}>
          <option value="30">30 horas</option>
          <option value="60">60 horas</option>
          <option value="90">90 horas</option>
        </Select>
        <Select label="Aulas Diárias" value={dailyClasses} onChange={setDailyClasses}>
          <option value="1">1 Aula (50 min)</option>
          <option value="2">2 Aulas (100 min)</option>
          <option value="3">3 Aulas (150 min)</option>
        </Select>
        <p className="text-sm text-gray-500">Cada aula tem 50 minutos.</p>
      </DialogContent>
      <DialogActions>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="default" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
  
}
