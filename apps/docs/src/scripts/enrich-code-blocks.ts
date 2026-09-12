// Wraps every Shiki-highlighted fenced code block on the page in a small
// header (language label + copy button). Shared by the architecture topic
// page and the journal, since both render markdown that may contain real
// ```lang fences.
export function enrichCodeBlocks(): void {
  for (const pre of document.querySelectorAll<HTMLPreElement>('pre.astro-code')) {
    if (pre.closest('.code-block')) continue; // already enriched

    const lang = pre.getAttribute('data-language') ?? 'text';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';

    const header = document.createElement('div');
    header.className = 'code-block-header';

    const label = document.createElement('span');
    label.className = 'code-block-lang';
    label.textContent = lang;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block-copy';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent ?? '');
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 1500);
      } catch {
        // clipboard API unavailable — silently leave the button as-is
      }
    });

    header.append(label, button);
    pre.replaceWith(wrapper);
    wrapper.append(header, pre);
  }
}
