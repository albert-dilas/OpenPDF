import Link from 'next/link';
import { tools } from '@/config/tools';

export default function Home() {
  return (
    <div className="bg-gray-50 flex-grow pt-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl tracking-tight">
            Toda herramienta para <span className="text-brand">PDF</span>,
            <br />
            en un solo lugar
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Todas las herramientas que necesitas para usar PDFs, a tu alcance. Todo 100% GRATIS y local en tu máquina.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full items-center text-center"
              >
                <div className={`p-4 rounded-xl ${tool.color} text-white group-hover:-translate-y-1 transition-transform duration-300 mb-4`}>
                  <Icon className="h-9 w-9" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-grow">
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
