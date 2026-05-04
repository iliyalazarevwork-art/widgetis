/**
 * Demo entry for module-smart-search.
 *
 * Production module fetches the product feed from
 * https://api.widgetis.com/api/v1/widgets/smart-search/feed (Origin-checked,
 * resolves to the merchant's site). The public demo runs on widgetis.com /
 * preview.widgetis.com / localhost — none of which is a registered merchant —
 * so the request 403s.
 *
 * Solution: shim `window.fetch` for the feed URL and return a baked-in catalog
 * of cosmetic products. The widget then runs its normal local-search path
 * (zero network) and the visitor sees real-feeling results.
 */
import smartSearch from './index';
import type { FeedIndex } from './feed';

const LOG = '[widgetality] smart-search (demo):';
const FEED_URL_FRAGMENT = '/widgets/smart-search/feed';

const CURRENCY = 'грн';

const PIC = (seed: string) => `https://picsum.photos/seed/${seed}/200/200`;

interface DemoProduct {
  id: string;
  name: string;
  vendor: string;
  cat: string;
  price: number;
  oldprice?: number;
  seed: string;
}

// Косметика — украïнський магазин
const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'p01', name: 'Крем для рук поживний',          vendor: 'Nivea',          cat: 'Догляд за тілом',     price: 189,  seed: 'krem-nivea' },
  { id: 'p02', name: 'Крем для обличчя зволожуючий',   vendor: 'La Roche-Posay', cat: 'Догляд за обличчям',  price: 890,  oldprice: 1090, seed: 'krem-lrp' },
  { id: 'p03', name: 'Крем нічний відновлюючий',       vendor: 'Vichy',          cat: 'Догляд за обличчям',  price: 1290, seed: 'krem-vichy' },
  { id: 'p04', name: 'Крем для тіла з олією ши',       vendor: 'Weleda',         cat: 'Догляд за тілом',     price: 540,  seed: 'krem-weleda' },
  { id: 'p05', name: 'Крем антивіковий 40+',           vendor: "L'Oréal",        cat: 'Догляд за обличчям',  price: 720,  seed: 'krem-loreal' },

  { id: 'p06', name: 'Олія аргани для волосся',        vendor: 'Moroccanoil',    cat: 'Волосся',             price: 1450, seed: 'oil-morocc' },
  { id: 'p07', name: 'Кокосова олія холодного віджиму', vendor: 'Сонях',          cat: 'Догляд за тілом',     price: 220,  seed: 'oil-coco' },
  { id: 'p08', name: 'Олія для тіла розслаблююча',     vendor: 'Weleda',         cat: 'Догляд за тілом',     price: 690,  seed: 'oil-weleda' },
  { id: 'p09', name: 'Ефірна олія лаванди',            vendor: 'Botanika',       cat: 'Ароматерапія',        price: 145,  seed: 'oil-lavender' },

  { id: 'p10', name: 'Мило ручної роботи «Лаванда»',   vendor: 'Маленька майстерня', cat: 'Догляд за тілом', price: 95,   seed: 'soap-lavender' },
  { id: 'p11', name: 'Рідке мило для рук',             vendor: 'Dove',           cat: 'Догляд за тілом',     price: 140,  seed: 'soap-dove' },
  { id: 'p12', name: 'Мило натуральне «Ялина»',        vendor: 'Маленька майстерня', cat: 'Догляд за тілом', price: 110,  seed: 'soap-pine' },

  { id: 'p13', name: 'Парфум жіночий квітковий',       vendor: 'Chanel',         cat: 'Парфумерія',          price: 4290, seed: 'parf-chanel' },
  { id: 'p14', name: 'Парфум чоловічий деревний',      vendor: 'Dior',           cat: 'Парфумерія',          price: 3890, oldprice: 4490, seed: 'parf-dior' },
  { id: 'p15', name: 'Парфум унісекс Santal 33',       vendor: 'Le Labo',        cat: 'Парфумерія',          price: 5290, seed: 'parf-lelabo' },

  { id: 'p16', name: 'Шампунь для жирного волосся',    vendor: 'Garnier',        cat: 'Волосся',             price: 165,  seed: 'shamp-garnier' },
  { id: 'p17', name: 'Шампунь відновлюючий BC',        vendor: 'Schwarzkopf',    cat: 'Волосся',             price: 540,  seed: 'shamp-bc' },
  { id: 'p18', name: 'Шампунь дитячий без сліз',       vendor: 'Mustela',        cat: 'Волосся',             price: 320,  seed: 'shamp-must' },

  { id: 'p19', name: 'Маска для волосся Olaplex №3',   vendor: 'Olaplex',        cat: 'Волосся',             price: 980,  seed: 'mask-olaplex' },
  { id: 'p20', name: 'Скраб для тіла кавовий',         vendor: 'Frank Body',     cat: 'Догляд за тілом',     price: 380,  seed: 'scrub-frank' },
];

function buildFeedIndex(): FeedIndex {
  return {
    version: 'demo',
    currency: CURRENCY,
    accentColor: null,
    categoryUrls: {},
    products: DEMO_PRODUCTS.map((p) => ({
      id: p.id,
      url: '#',
      name: p.name,
      price: p.price,
      oldprice: p.oldprice ?? 0,
      picture: PIC(p.seed),
      vendor: p.vendor,
      cat: p.cat,
      available: true,
      st: `${p.name} ${p.vendor} ${p.cat}`.toLowerCase(),
    })),
  };
}

function shimFetch(): void {
  const original = window.fetch;
  if (!original) return;

  const feed = buildFeedIndex();

  window.fetch = function patched(input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request)?.url ?? '';

    if (url.includes(FEED_URL_FRAGMENT)) {
      console.log(LOG, 'shimmed feed — returning baked-in demo catalog');
      return Promise.resolve(
        new Response(JSON.stringify(feed), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }),
      );
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

const smartSearchDemo: typeof smartSearch = (config, i18n) => {
  console.log(LOG, 'init — shimming feed endpoint');
  shimFetch();
  return smartSearch(config, i18n);
};

export default smartSearchDemo;
