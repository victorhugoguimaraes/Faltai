import { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login({ setLogado }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const fazerLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      setLogado(true);
    } catch {
      setErro("Erro no login. Verifique email/senha.");
    }
  };

  const registrar = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await setDoc(doc(db, "usuarios", userCredential.user.uid), { materias: [] });
      setLogado(true);
    } catch {
      setErro("Erro ao registrar. Email pode estar em uso.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
        <h1 className="site-title">Faltaí</h1>
        {erro && <p className="text-red-500 mb-4 text-center">{erro}</p>}
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button className="btn-primary" onClick={fazerLogin}>Entrar</button>
        <button className="btn-secondary" onClick={registrar}>Registrar</button>
      </div>
    </div>
  );
}
