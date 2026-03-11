const fs = require('fs');
let file = fs.readFileSync('components/chat/message-bubble.tsx', 'utf8');

const regex = /{hasSources && \([\s\S]*?className="text-slate-500">Sources[\s\S]*?<\/div>[\s\S]*?\)}/;

const replacement = `{hasSources && (
                  <div className="mt-5 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      <Globe className="size-3.5 text-sky-400" />
                      ISHA XOGTA (SOURCES)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.sources?.map((source, index) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          title={source.title}
                          className="group flex w-full max-w-[280px] flex-col gap-1 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 transition-all hover:bg-white/10 hover:border-white/10 text-left no-underline"
                        >
                          <span className="text-[13px] font-medium text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                             <span className="text-sky-400 mr-1 opacity-70">[{index + 1}]</span>
                             {source.title}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 group-hover:text-slate-400 transition-colors flex items-center gap-1.5">
                            {source.domain}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}`;

if(regex.test(file)) {
  file = file.replace(regex, replacement);
  fs.writeFileSync('components/chat/message-bubble.tsx', file);
  console.log("Successfully replaced");
} else {
  console.log("Regex didn't match.");
}
