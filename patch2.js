const fs = require('fs');
let content = fs.readFileSync('components/chat/message-bubble.tsx', 'utf8');

const index = content.lastIndexOf('{hasSources && ('); 
console.log(index);

if (index !== -1) {
    const keep = content.slice(0, index);
    const newBlock = `{hasSources && (
                  <div className="mt-5 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">
                      <Globe className="size-3.5 text-sky-400" />
                      ISHA XOGTA (SOURCES)
                    </div>
                    <div className="flex overflow-x-auto gap-2.5 pb-3 chat-scrollbar-soft w-[100%] max-w-[85vw] snap-x">
                      {message.sources?.map((source, index) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          title={source.title}
                          className="group/source flex flex-col justify-between w-[160px] min-w-[160px] sm:w-[180px] sm:min-w-[180px] h-[76px] shrink-0 snap-start rounded-[14px] border border-white/10 bg-[#2f2f2f] p-3 transition-all hover:bg-[#383838] hover:border-white/20 text-left no-underline relative"
                        >
                          <span className="text-[13px] font-medium text-slate-200 line-clamp-2 group-hover/source:text-sky-300 transition-colors leading-snug">
                             {source.title}
                          </span>
                          <span className="text-[10.5px] font-medium text-slate-500 line-clamp-1 transition-colors flex items-center gap-1.5 mt-1">
                            <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[8px]">
                              {index + 1}
                            </span>
                            <span className="truncate">{source.domain}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {isStreaming && <span className="streaming-caret ml-0.5 inline-block h-5 w-0.5 rounded-full bg-sky-200/90 align-[-2px]" />}
                
                {!isStreaming && (
                  <div className="mt-3 flex opacity-0 transition-opacity group-hover:opacity-100 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="Copy message"
                      className="inline-flex py-1.5 px-2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                      title="Copy response"
                    >
                      {isCopied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </article>
    );
}`;

    fs.writeFileSync('components/chat/message-bubble.tsx', keep + newBlock);
}