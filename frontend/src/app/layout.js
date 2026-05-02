import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'AquaFleet - Gestao de Coletas de Agua Offshore',
  description: 'Sistema inteligente de gestao, controle regulatorio e previsao de coletas de agua em embarcacoes offshore',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
