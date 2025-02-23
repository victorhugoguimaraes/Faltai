export default function Header({ sair }) {
    return (
      <div className="flex justify-between items-center mb-6">
        <h1 className="site-title">Faltaí</h1>
        <button className="btn-danger" onClick={sair}>Sair</button>
      </div>
    );
  }
  