'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAlertas } from '@/lib/api';

const menuItems = [
  { section: 'Principal' },
  { href: '/', icon: '\u2302', label: 'Dashboard' },
  { href: '/alertas', icon: '\u26A0', label: 'Alertas', hasBadge: true },
  { section: 'Cadastros' },
  { href: '/empresas', icon: '\u2616', label: 'Empresas' },
  { href: '/embarcacoes', icon: '\u2693', label: 'Embarcacoes' },
  { section: 'Operacional' },
  { href: '/coletas', icon: '\u2620', label: 'Coletas' },
  { href: '/agenda', icon: '\u2637', label: 'Agenda' },
  { href: '/calendario', icon: '\u2610', label: 'Calendario' },
  { section: 'Inteligencia' },
  { href: '/previsao', icon: '\u2604', label: 'Previsao' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    getAlertas().then(a => setAlertCount(a.length)).catch(() => {});
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">AF</div>
        <div>
          <h1>AquaFleet</h1>
          <span>Gestao de Coletas</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="sidebar-section-title">{item.section}</div>;
          }
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.hasBadge && alertCount > 0 && (
                <span className="sidebar-badge">{alertCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
