// source: https://home24.in.ua/
// extracted: 2026-05-07T21:21:36.174Z
// scripts: 1

// === script #1 (length=2618) ===
document.addEventListener('DOMContentLoaded', () => {
    const modsRootFirst =
      document.querySelector('.product__modifications') ||
      document.querySelector('div[data-view-block="modifications"]');
    if (!modsRootFirst) return;

    const showRelevantModifications = () => {
      const modsRoot =
        document.querySelector('.product__modifications') ||
        document.querySelector('div[data-view-block="modifications"]');
      if (!modsRoot) return;
      const modificationsEl = document.querySelector('#modificationsViewSwitches');
      const descBlockMobile = document.querySelector(
        '.product__block.product__block--description.j-product-block'
      );
      if (modificationsEl && descBlockMobile) {
        descBlockMobile.style.display = 'none';
      } else {
        const vidgukEl =
          document.querySelector('a[href="#vіdguki-1"]') ||
          document.querySelector('a[href="#otzyvy-1"]');
        const hasSibling =
          modificationsEl.previousElementSibling || modificationsEl.nextElementSibling;
        if (modificationsEl && !hasSibling) {
          const descEl =
            document.querySelector('a[href="#opis-1"]') ||
            document.querySelector('a[href="#opisanie-1"]');
          descEl.classList.remove('is-active');
          descEl.style.display = 'none';
          const contentIdEl =
            document.querySelector('div[data-content-id="opis-1"]') ||
            document.querySelector('div[data-content-id="opisanie-1"]');
          contentIdEl.style.display = 'none';
          document.querySelector('a[href="#xarakteristiki-1"]').classList.toggle('is-active');
          document.querySelector('div[data-content-id="xarakteristiki-1"]').style.display = 'block';
        }
      }
      const modificationsTitle = new Set(modificationsEl?.dataset?.switches?.split('|') || []);
      modsRoot.querySelectorAll('.modification').forEach(divEl => {
        const atrrTitle =
          divEl.querySelector('.modification__body select[data-prop], .modification__body input[data-prop]')?.dataset?.prop ?? '';
        divEl.style.display = modificationsTitle.has(atrrTitle) ? 'block' : 'none';
      });
    };

    showRelevantModifications();

    const observer = new MutationObserver(() => showRelevantModifications());
    observer.observe(
      document.querySelector('div[data-view-block="group_4.3"]') ||
        document.querySelector('.product__block.product__block--modifications.j-product-block'),
      { childList: true, subtree: true, attributes: true }
    );
  });
