import { Quote } from "lucide-react";

const testimonials = [
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto",
      handle: "@roberto_cfo",
      role: "CFO na TechFlow",
      name: "Roberto Almeida",
      quote: "O fechamento mensal que levava 5 dias agora leva 4 horas. A conciliação automática via OFX e o DRE em tempo real mudaram nossa governança.",
      highlight: true,
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana",
      handle: "@juliana_vc",
      role: "Founder na ScaleUp",
      name: "Juliana Costa",
      quote: "Precisávamos de auditoria e logs de acesso para nossa rodada de investimento. O Montte entregou tudo pronto (compliance) sem custar uma fortuna.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcos",
      handle: "@marcos_dev",
      role: "CTO na DevHouse",
      name: "Marcos Silva",
      quote: "A API é impecável. Conectamos nosso sistema interno de faturamento ao Montte em uma tarde. Finalmente um financeiro developer-friendly.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fernanda",
      handle: "@fer_finance",
      role: "Controller",
      name: "Fernanda Lima",
      quote: "A gestão de centros de custo e o budget vs. actual me dão a visibilidade que o Excel nunca deu. Consigo ver exatamente onde estamos queimando caixa.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      handle: "@carlos_invest",
      role: "Investidor Anjo",
      name: "Carlos Mendes",
      quote: "Recomendo para todas as startups do meu portfólio. É a maneira mais rápida de garantir que o dinheiro está sendo bem gerido desde o dia 1.",
      highlight: true,
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz",
      handle: "@bia_ops",
      role: "Head de Ops",
      name: "Beatriz Souza",
      quote: "A funcionalidade de aprovação de gastos e gestão de time eliminou o gargalo de senhas compartilhadas. Seguro e eficiente.",
   },
];

export default function SocialProof() {
   return (
      <section className="bg-[#151925] py-20 sm:py-28 relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center px-4 text-center mb-16">
               <span className="text-emerald-500 font-semibold tracking-wider uppercase text-xs mb-4 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-full">
                  Comunidade & Parceiros
               </span>
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-3xl leading-[1.1]">
                  A escolha de times que valorizam <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                     governança e velocidade.
                  </span>
               </h2>
               <p className="text-gray-400 mt-6 max-w-2xl text-lg leading-relaxed">
                  De startups em hipercrescimento a operações consolidadas. Veja
                  por que CFOs e Founders estão migrando para o Montte.
               </p>
            </div>

            <div className="relative mb-24 flex flex-col items-center">
               <p className="text-sm text-gray-500 mb-8 font-medium">
                  INTEGRADO AO ECOSSISTEMA MODERNO
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {testimonials.map((testimonial, index) => (
                  <div className={`break-inside-avoid h-full`} key={index}>
                     <div
                        className={`h-full flex flex-col justify-between rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${testimonial.highlight ? "bg-[#1C202E] border-primary/30 shadow-lg shadow-primary/5" : "bg-[#1C202E]/50 border-[#2A3042]"}`}
                     >
                        <div>
                           <Quote
                              className={`size-8 mb-4 ${testimonial.highlight ? "text-emerald-500" : "text-gray-600"}`}
                           />
                           <p className="text-gray-300 leading-relaxed text-[15px]">
                              "{testimonial.quote}"
                           </p>
                        </div>

                        <div className="mt-8 flex items-center gap-3 pt-6 border-t border-[#2A3042]">
                           <img
                              alt={testimonial.name}
                              className="size-10 rounded-full border border-[#2A3042]"
                              src={testimonial.avatar}
                           />
                           <div>
                              <div className="text-white font-bold text-sm">
                                 {testimonial.name}
                              </div>
                              <div className="text-emerald-500/80 text-xs font-medium">
                                 {testimonial.role}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <style>{`
            @keyframes scroll {
               0% { transform: translateX(0); }
               100% { transform: translateX(-33.33%); }
            }
            .logo-scroll {
               animation: scroll 40s linear infinite;
            }
            .logo-scroll:hover {
               animation-play-state: paused;
            }
            /* Utility class for masking edges */
            .mask-linear-fade {
                mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
         `}</style>
      </section>
   );
}
