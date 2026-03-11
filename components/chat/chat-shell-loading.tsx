export function ChatShellLoading() {
  return (
    <main className="grid h-screen grid-cols-1 overflow-hidden bg-transparent md:grid-cols-[280px_1fr]">
      <div className="hidden overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(8,15,33,0.98),rgba(10,20,44,0.92))] md:block md:h-screen">
        <div className="flex h-full flex-col px-3 py-4">
          <div className="space-y-4 pb-4">
            <div className="h-12 rounded-xl bg-white/6 animate-pulse" />
            <div className="h-10 rounded-xl bg-white/4 animate-pulse" />
            <div className="h-10 rounded-xl bg-white/4 animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="h-4 w-24 rounded-full bg-white/6 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/4 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/4 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/4 animate-pulse" />
          </div>
        </div>
      </div>

      <section className="relative min-h-0 min-w-0 overflow-hidden p-2.5 md:h-screen md:p-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.12),transparent_24%),linear-gradient(180deg,rgba(5,10,24,0.18),rgba(2,6,23,0.02))]" />

        <div className="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,26,52,0.92),rgba(15,23,42,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-20 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-160 flex-1 flex-col gap-6 overflow-hidden">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span>Loading chat</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-6 pb-12">
                  <div className="ml-auto w-full max-w-90 rounded-[20px] bg-white/8 px-4 py-3">
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 rounded-full bg-white/10" />
                      <div className="h-3 w-5/6 rounded-full bg-white/8" />
                    </div>
                  </div>

                  <div className="flex w-full gap-3">
                    <div className="mt-1 size-9 shrink-0 rounded-full border border-sky-300/15 bg-sky-300/10" />
                    <div className="flex-1 rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
                      <div className="space-y-3 animate-pulse">
                        <div className="h-3 w-[88%] rounded-full bg-white/10" />
                        <div className="h-3 w-[72%] rounded-full bg-white/8" />
                        <div className="h-3 w-[81%] rounded-full bg-white/10" />
                        <div className="h-3 w-[54%] rounded-full bg-white/8" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,33,0.96),rgba(7,12,25,0.98))] px-5 py-4 backdrop-blur-xl">
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 rounded-full bg-white/8" />
                  <div className="h-12 rounded-[20px] bg-white/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}