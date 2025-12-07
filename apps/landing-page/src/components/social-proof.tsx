import { CircleCheckIcon } from "lucide-react";

const logos = [
   {
      alt: "Nvidia Logo",
      height: "h-5",
      src: "https://html.tailus.io/blocks/customers/nvidia.svg",
   },
   {
      alt: "Column Logo",
      height: "h-4",
      src: "https://html.tailus.io/blocks/customers/column.svg",
   },
   {
      alt: "GitHub Logo",
      height: "h-4",
      src: "https://html.tailus.io/blocks/customers/github.svg",
   },
   {
      alt: "Nike Logo",
      height: "h-5",
      src: "https://html.tailus.io/blocks/customers/nike.svg",
   },
   {
      alt: "Lemon Squeezy Logo",
      height: "h-5",
      src: "https://html.tailus.io/blocks/customers/lemonsqueezy.svg",
   },
   {
      alt: "Laravel Logo",
      height: "h-4",
      src: "https://html.tailus.io/blocks/customers/laravel.svg",
   },
   {
      alt: "Lilly Logo",
      height: "h-7",
      src: "https://html.tailus.io/blocks/customers/lilly.svg",
   },
   {
      alt: "OpenAI Logo",
      height: "h-6",
      src: "https://html.tailus.io/blocks/customers/openai.svg",
   },
];

const features = [
   { title: "Freelancers managing personal finances" },
   { title: "Small businesses tracking expenses" },
   { title: "Growing teams needing financial insights" },
   { title: "Enterprises with complex reporting needs" },
];

export default function SocialProof() {
   return (
      <section className="bg-background py-16 sm:py-24">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-16 max-lg:flex-col">
               <div className="flex-1">
                  <div className="space-y-4">
                     <p className="text-primary text-sm font-medium uppercase tracking-wide">
                        Trusted by Thousands
                     </p>
                     <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        From Solo Founders to Enterprise Teams
                     </h2>
                     <p className="text-muted-foreground text-lg">
                        Whether you're a freelancer tracking your first invoice
                        or an enterprise managing complex finances, our platform
                        scales with your needs. Join businesses of all sizes who
                        trust us with their financial management.
                     </p>
                  </div>

                  <ul className="mt-10 space-y-5 text-lg font-medium">
                     {features.map((feature, index) => (
                        <li className="flex items-center gap-3" key={index}>
                           <CircleCheckIcon className="text-primary size-5 shrink-0" />
                           <span>{feature.title}</span>
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="w-full flex-1 lg:max-w-md">
                  <div className="bg-muted/30 border-border rounded-2xl border p-8">
                     <p className="text-muted-foreground mb-6 text-center text-sm font-medium">
                        Powering businesses from startups to enterprises
                     </p>
                     <div className="relative overflow-hidden">
                        <div className="animate-scroll flex gap-16">
                           {[...logos, ...logos].map((logo, index) => (
                              <div
                                 className="flex shrink-0 items-center"
                                 key={index}
                              >
                                 <img
                                    alt={logo.alt}
                                    className={`${logo.height} w-auto dark:invert`}
                                    src={logo.src}
                                 />
                              </div>
                           ))}
                        </div>
                        <div className="from-muted/30 pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent" />
                        <div className="from-muted/30 pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent" />
                     </div>

                     <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        <div>
                           <p className="text-2xl font-bold">10K+</p>
                           <p className="text-muted-foreground text-xs">
                              Active Users
                           </p>
                        </div>
                        <div>
                           <p className="text-2xl font-bold">50+</p>
                           <p className="text-muted-foreground text-xs">
                              Countries
                           </p>
                        </div>
                        <div>
                           <p className="text-2xl font-bold">99.9%</p>
                           <p className="text-muted-foreground text-xs">
                              Uptime
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <style>{`
            @keyframes scroll {
               0% {
                  transform: translateX(0);
               }
               100% {
                  transform: translateX(-50%);
               }
            }
            .animate-scroll {
               animation: scroll 30s linear infinite;
            }
            .animate-scroll:hover {
               animation-play-state: paused;
            }
         `}</style>
      </section>
   );
}
