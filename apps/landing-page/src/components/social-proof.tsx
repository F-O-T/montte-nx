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

const testimonials = [
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      handle: "@mariafinance",
      hidden: false,
      name: "Maria Santos",
      quote: "This finance tracker completely changed how I manage my business expenses. Setup took 15 minutes and now I have complete visibility.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      handle: "@carlosdev",
      hidden: true,
      name: "Carlos Silva",
      quote: "Finally a finance tool that understands freelancers. The automatic categorization saves me hours every month.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
      handle: "@anaentrepreneur",
      hidden: false,
      name: "Ana Costa",
      quote: "The dashboard is SO clean! A fantastic tool for tracking multiple revenue streams.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro",
      handle: "@pedrobusiness",
      hidden: false,
      name: "Pedro Oliveira",
      quote: "By far this has given me more financial insights than any other tool. The alerts for unusual spending patterns are incredibly useful. Great UX on top of all the features.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia",
      handle: "@juliatech",
      hidden: false,
      name: "Julia Ferreira",
      quote: "One tool to rule them all. This year, this finance tracker won my heart - well designed and thoughtfully built.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
      handle: "@lucasstartup",
      hidden: false,
      name: "Lucas Mendes",
      quote: "I just checked this out and have never been so happy with a financial tool. Perfect for our growing startup.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz",
      handle: "@beatrizfreelance",
      hidden: false,
      name: "Beatriz Lima",
      quote: "Looking for expense tracking? I recommend this tool. Perfect support, answered my questions in minutes, and it's the first actually good-looking finance app.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael",
      handle: "@rafaelcfo",
      hidden: true,
      name: "Rafael Souza",
      quote: "Switched from spreadsheets over the weekend, looking pretty good. Finally have real-time insights.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Camila",
      handle: "@camilaops",
      hidden: true,
      name: "Camila Rodrigues",
      quote: "What are you using for expense tracking and budgeting? For me the go-to is currently this app - love the simplicity and powerful features.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego",
      handle: "@diegofounders",
      hidden: true,
      name: "Diego Almeida",
      quote: "I'm utterly blown away! They do everything. I'm now tracking all my accounts, custom alerts for overspending, bill reminders, and loads more.",
   },
   {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fernanda",
      handle: "@fernandadesign",
      hidden: true,
      name: "Fernanda Martins",
      quote: "Simple, does a great job, and has a generous free plan for those just starting out. I don't remember finding anything close to it years ago.",
   },
];

export default function SocialProof() {
   return (
      <section className="bg-background py-16 sm:py-24">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center px-4 text-center">
               <h2 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-semibold text-transparent md:text-4xl lg:text-[44px] lg:leading-tight">
                  Don't just take our word for it
               </h2>
               <p className="text-muted-foreground mt-4 max-w-[624px]">
                  We're proud to be working with businesses of all sizes - from
                  individual freelancers to growing enterprises - and are
                  thankful for their feedback, suggestions, and support.
               </p>
            </div>

            <div className="mt-14" />

            <div className="relative -mb-20 mt-4 flex flex-col items-center overflow-hidden">
               <div className="mx-auto max-w-[1684px]">
                  <div className="scale-75 md:scale-100">
                     <div className="customers-scroll flex justify-center">
                        <div className="flex min-w-max gap-16 px-8">
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
                     </div>
                  </div>
               </div>

               <div className="pointer-events-none absolute inset-0 flex justify-center">
                  <div className="from-background h-full grow bg-linear-to-r md:from-50%" />
                  <div className="min-w-[200px] md:min-w-[1000px]" />
                  <div className="from-background h-full grow bg-gradient-to-l md:from-50%" />
               </div>
            </div>

            <div className="mt-24 sm:columns-2 md:columns-3 lg:columns-4">
               {testimonials.map((testimonial, index) => (
                  <div
                     className={`mx-auto max-w-[320px] break-inside-avoid pb-4 ${testimonial.hidden ? "hidden sm:block" : ""}`}
                     key={index}
                  >
                     <div className="bg-card/80 border-border/20 rounded-xl border p-5 backdrop-blur-xl">
                        <p className="text-foreground/90">
                           {testimonial.quote}
                        </p>
                        <div className="mt-5" />
                        <div className="-m-5 flex items-start p-5">
                           <img
                              alt={testimonial.name}
                              className="mt-1 size-9 shrink-0 rounded-full"
                              src={testimonial.avatar}
                           />
                           <div className="mx-2 grow">
                              <div className="text-foreground font-bold">
                                 {testimonial.name}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                 {testimonial.handle}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="h-32" />
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
            .customers-scroll {
               animation: scroll 30s linear infinite;
            }
            .customers-scroll:hover {
               animation-play-state: paused;
            }
         `}</style>
      </section>
   );
}
