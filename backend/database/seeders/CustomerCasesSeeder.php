<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class CustomerCasesSeeder extends Seeder
{
    private const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#22c55e', '#06b6d4', '#a855f7'];

    // Indices with rating 4 so that avg = 447/93 ≈ 4.8 (18 fours + 75 fives)
    private const FOUR_RATED = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89];

    public function run(): void
    {
        $now = now();

        foreach (self::sites() as $i => $site) {
            DB::table('customer_cases')->updateOrInsert(
                ['store_url' => $site['store_url']],
                [
                    'store'       => $site['store'],
                    'store_url'   => $site['store_url'],
                    'owner'       => $site['owner'],
                    'description' => json_encode(['en' => $site['description'], 'uk' => $site['description']]),
                    'review_rating' => in_array($i, self::FOUR_RATED, true) ? 4 : 5,
                    'color'       => self::COLORS[$i % count(self::COLORS)],
                    'is_published' => true,
                    'sort_order'  => $i,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]
            );
        }
    }

    /** @return list<array{store: string, store_url: string, owner: string, description: string}> */
    public static function sites(): array
    {
        return [
            ['store' => 'ukrinvestbud.com', 'store_url' => 'https://ukrinvestbud.com', 'owner' => 'Ukrinvestbud', 'description' => 'Будівельна компанія'],
            ['store' => 'lifehouse.com.ua', 'store_url' => 'https://lifehouse.com.ua', 'owner' => 'Life House', 'description' => 'Корпоративний сайт'],
            ['store' => 'ferroconcrete.com.ua', 'store_url' => 'https://ferroconcrete.com.ua', 'owner' => 'FerroСoncrete', 'description' => 'Будівельна компанія'],
            ['store' => 'goldenart.com.ua', 'store_url' => 'https://goldenart.com.ua', 'owner' => 'Golden Art', 'description' => 'Меблева студія'],
            ['store' => 'antidron.store', 'store_url' => 'https://antidron.store', 'owner' => 'Anti Drone House', 'description' => 'Інтернет-магазин РЕБ'],
            ['store' => 'speakclubingerman.com', 'store_url' => 'https://speakclubingerman.com', 'owner' => 'Speak Club', 'description' => 'Мовна школа онлайн'],
            ['store' => 'beautynishe.com', 'store_url' => 'https://www.beautynishe.com', 'owner' => 'Beauty Nishe', 'description' => 'Магазин парфумерії'],
            ['store' => 'molfar.shop', 'store_url' => 'https://molfar.shop', 'owner' => 'Мольфар', 'description' => 'Інтернет-магазин'],
            ['store' => 'energyrol.com.ua', 'store_url' => 'https://energyrol.com.ua/', 'owner' => 'Energy Rol', 'description' => 'Маркетплейс ролет'],
            ['store' => 'blog.cryptomannn.com', 'store_url' => 'https://blog.cryptomannn.com', 'owner' => 'Cryptomannn', 'description' => 'Крипто-блог'],
            ['store' => 'gorishokmarket.com.ua', 'store_url' => 'https://gorishokmarket.com.ua', 'owner' => 'Gorishok Market', 'description' => 'Інтернет-магазин'],
            ['store' => 'friendlywindtechnology.com', 'store_url' => 'https://friendlywindtechnology.com', 'owner' => 'Friendly Wind', 'description' => 'Виробник вітрових турбін'],
            ['store' => 'hypnotic.care', 'store_url' => 'https://hypnotic.care', 'owner' => 'Hypnotic', 'description' => 'Інтернет-магазин'],
            ['store' => 'sonstec.com', 'store_url' => 'https://sonstec.com', 'owner' => 'Sonstec', 'description' => 'Постільна білизна'],
            ['store' => 'alexzagor.com', 'store_url' => 'https://alexzagor.com', 'owner' => 'Alex Zagor', 'description' => "Дизайн інтер'єру"],
            ['store' => 'lakjstore.com', 'store_url' => 'https://lakjstore.com/', 'owner' => 'Lakj Store', 'description' => 'Магазин одягу'],
            ['store' => 'artizan.com.ua', 'store_url' => 'https://www.artizan.com.ua', 'owner' => 'Artizan', 'description' => 'Будівельна компанія'],
            ['store' => 'yulias-studio.com.ua', 'store_url' => 'https://yulias-studio.com.ua', 'owner' => "Yulia's Studio", 'description' => 'Студія білизни'],
            ['store' => 'fainashvachka.in.ua', 'store_url' => 'https://fainashvachka.in.ua/', 'owner' => 'Faina Swachka', 'description' => 'Пошив та друк одягу'],
            ['store' => 'busonline.ge', 'store_url' => 'https://busonline.ge/ru/', 'owner' => 'Bus Online', 'description' => 'Автобусні перевезення'],
            ['store' => 'work-in.lt', 'store_url' => 'https://www.work-in.lt/uk/', 'owner' => 'Work-In', 'description' => 'Пошук роботи'],
            ['store' => 'vyshgorod-sky.com.ua', 'store_url' => 'https://vyshgorod-sky.com.ua', 'owner' => 'Вишгород Sky', 'description' => 'Житловий комплекс'],
            ['store' => 'tailspace.com.ua', 'store_url' => 'https://tailspace.com.ua', 'owner' => 'Tail Space', 'description' => 'Зоомагазин'],
            ['store' => 'personal-advokat.com', 'store_url' => 'https://personal-advokat.com/', 'owner' => 'Personal Advokat', 'description' => 'Юридичні послуги'],
            ['store' => 'dana-water.com.ua', 'store_url' => 'https://dana-water.com.ua', 'owner' => 'Dana Water', 'description' => 'Доставка води'],
            ['store' => 'viza-kyiv.com.ua', 'store_url' => 'https://viza-kyiv.com.ua', 'owner' => 'Viza Kyiv', 'description' => 'Оформлення віз'],
            ['store' => 'warto.com.ua', 'store_url' => 'https://www.warto.com.ua/', 'owner' => 'Warto', 'description' => 'Корпоративний сайт'],
            ['store' => 'true-ag.com', 'store_url' => 'https://true-ag.com/', 'owner' => 'True AG', 'description' => 'Корпоративний сайт'],
            ['store' => 'sklanka.com.ua', 'store_url' => 'https://sklanka.com.ua/', 'owner' => 'Sklanka', 'description' => 'Інтернет-магазин'],
            ['store' => 'exim.ppb.com.ua', 'store_url' => 'https://exim.ppb.com.ua/', 'owner' => 'Перша приватна броварня', 'description' => 'Корпоративний магазин'],
            ['store' => 'osvita.dp.ua', 'store_url' => 'https://osvita.dp.ua/', 'owner' => 'Osvita.dp.ua', 'description' => 'Освітній портал'],
            ['store' => 'wonjyou.studio', 'store_url' => 'https://wonjyou.studio/', 'owner' => 'Wonjyou Studio', 'description' => 'Лендинг'],
            ['store' => 'times-event.de', 'store_url' => 'https://times-event.de/', 'owner' => 'Times Event', 'description' => 'Сайт-візитка'],
            ['store' => 'fruits-berries.com', 'store_url' => 'https://fruits-berries.com/', 'owner' => 'Fruits Berries', 'description' => 'Інтернет-магазин'],
            ['store' => 'vyco-tech.com', 'store_url' => 'https://vyco-tech.com/en', 'owner' => 'Vyco-tech', 'description' => 'Корпоративний сайт'],
            ['store' => 'lux.joie.com.ua', 'store_url' => 'https://lux.joie.com.ua/', 'owner' => 'Шоу рум джакузі', 'description' => 'Лендинг-магазин'],
            ['store' => 'mazepa.org.ua', 'store_url' => 'https://mazepa.org.ua/', 'owner' => 'Mazepa GRG', 'description' => 'Лендинг-візитка'],
            ['store' => 'manoki.coffee', 'store_url' => 'https://manoki.coffee/', 'owner' => 'Manoki Coffee', 'description' => 'Сайт-візитка'],
            ['store' => 'near.in.ua', 'store_url' => 'https://near.in.ua/', 'owner' => 'Near Agency', 'description' => 'Корпоративний сайт'],
            ['store' => 'southcoastinvestou.com', 'store_url' => 'https://southcoastinvestou.com/', 'owner' => 'South Coast Invest', 'description' => 'Сайт-візитка'],
            ['store' => 'pride-byd.com', 'store_url' => 'https://pride-byd.com/', 'owner' => 'Pride BYD', 'description' => 'Лендинг'],
            ['store' => 'autolegion.ua', 'store_url' => 'https://www.autolegion.ua/', 'owner' => 'Autolegion', 'description' => 'Лендинг'],
            ['store' => 'bel-trans.com.ua', 'store_url' => 'https://www.bel-trans.com.ua/', 'owner' => 'Bel Trans', 'description' => 'Корпоративний сайт'],
            ['store' => 'kudologistics.com', 'store_url' => 'https://kudologistics.com/uk/pro-kompaniyu-2/', 'owner' => 'Kudo Logistics', 'description' => 'Логістика'],
            ['store' => 'dappers.com.ua', 'store_url' => 'https://dappers.com.ua/', 'owner' => 'Dappers Barbershop', 'description' => 'Лендинг-візитка'],
            ['store' => 'planetaclimata.com', 'store_url' => 'https://planetaclimata.com/', 'owner' => 'Планета Климата', 'description' => 'Корпоративний портал'],
            ['store' => 'prime-trans-ua.com', 'store_url' => 'https://prime-trans-ua.com/', 'owner' => 'Prime Trans', 'description' => 'Лендинг'],
            ['store' => 'slimness.com.ua', 'store_url' => 'http://slimness.com.ua/', 'owner' => 'Slimness', 'description' => 'Інтернет-магазин'],
            ['store' => 't-i-d-s-s.com', 'store_url' => 'https://t-i-d-s-s.com/', 'owner' => 'T-I-D-S-S', 'description' => 'Лендинг-візитка'],
            ['store' => 'apk.joie.com.ua', 'store_url' => 'https://apk.joie.com.ua/', 'owner' => 'APK Global', 'description' => 'Корпоративний сайт'],
            ['store' => 'fixflip-electronics.com', 'store_url' => 'https://fixflip-electronics.com/', 'owner' => 'Fixflip', 'description' => 'Портал'],
            ['store' => 'ventoxx.joie.com.ua', 'store_url' => 'https://ventoxx.joie.com.ua/', 'owner' => 'Ventoxx', 'description' => 'Сайт-візитка'],
            ['store' => 'divanstar.com.ua', 'store_url' => 'https://divanstar.com.ua/', 'owner' => 'Divanstar', 'description' => 'Інтернет-магазин'],
            ['store' => 'avost.com.ua', 'store_url' => 'http://avost.com.ua/', 'owner' => 'AVOST', 'description' => 'Лендинг'],
            ['store' => 'krov-montazh.com', 'store_url' => 'https://krov-montazh.com/', 'owner' => 'Krov Montazh', 'description' => 'Лендинг'],
            ['store' => 'arcus-ukraine.com', 'store_url' => 'https://arcus-ukraine.com/', 'owner' => 'Arcus Ukraine', 'description' => 'Корпоративний портал'],
            ['store' => 'aron.ua', 'store_url' => 'https://aron.ua/', 'owner' => 'ARON ua', 'description' => 'Корпоративний сайт'],
            ['store' => 've-basa.com', 'store_url' => 'https://ve-basa.com/', 'owner' => 'VE Basa', 'description' => 'Магазин електрики'],
            ['store' => 'study.joie.com.ua', 'store_url' => 'https://study.joie.com.ua/', 'owner' => 'Studyvoyage', 'description' => 'Освітній портал'],
            ['store' => 'kuzminsky.clinic', 'store_url' => 'https://kuzminsky.clinic/', 'owner' => 'Kuzminsky Clinic', 'description' => 'Медичний сайт'],
            ['store' => '7clean.joie.com.ua', 'store_url' => 'https://7clean.joie.com.ua/', 'owner' => '7Clean', 'description' => 'Лендинг'],
            ['store' => 'carbook.mobi', 'store_url' => 'https://carbook.mobi/', 'owner' => 'Carbook', 'description' => 'Корпоративний сайт'],
            ['store' => 'carfin.in.ua', 'store_url' => 'https://carfin.in.ua/pozyka-gotivkoy/', 'owner' => 'Carfin', 'description' => 'Лендинг'],
            ['store' => 'law.joie.com.ua', 'store_url' => 'https://law.joie.com.ua/', 'owner' => 'Law Company', 'description' => 'Юридична компанія'],
            ['store' => 'zabros.com.ua', 'store_url' => 'https://zabros.com.ua/', 'owner' => 'Zabros', 'description' => 'Інтернет-магазин'],
            ['store' => 'venus.joie.com.ua', 'store_url' => 'https://venus.joie.com.ua/', 'owner' => 'Venus Estate', 'description' => 'Нерухомість'],
            ['store' => 'defense.joie.com.ua', 'store_url' => 'https://defense.joie.com.ua/', 'owner' => 'Defence Agency', 'description' => 'Охоронне агентство'],
            ['store' => 'sushi.joie.com.ua', 'store_url' => 'https://sushi.joie.com.ua/', 'owner' => 'Доставка суші', 'description' => 'Доставка їжі'],
            ['store' => 'sneakers-kross.com.ua', 'store_url' => 'https://sneakers-kross.com.ua/ru/', 'owner' => 'Sneakers Kross', 'description' => 'Інтернет-магазин'],
            ['store' => 'yaponahata.joie.com.ua', 'store_url' => 'https://yaponahata.joie.com.ua/', 'owner' => 'Японахата', 'description' => 'Доставка їжі'],
            ['store' => 'oknagrad.net', 'store_url' => 'https://oknagrad.net/', 'owner' => 'Oknagrad', 'description' => 'Корпоративний сайт'],
            ['store' => 'ariscard.com', 'store_url' => 'https://ariscard.com/', 'owner' => 'Ariscard', 'description' => 'Мережа АЗС'],
            ['store' => 'vladyslav-saychenko.com', 'store_url' => 'https://vladyslav-saychenko.com/', 'owner' => 'Vladyslav Saychenko', 'description' => 'Сайт композитора'],
            ['store' => 'uael.in.ua', 'store_url' => 'https://uael.in.ua/', 'owner' => 'UAEL', 'description' => 'Корпоративний сайт'],
            ['store' => 'respektpersonal.com.ua', 'store_url' => 'https://respektpersonal.com.ua/', 'owner' => 'Respekt Personal', 'description' => 'Портал пошуку роботи'],
            ['store' => 'hunterprolight.com', 'store_url' => 'https://hunterprolight.com/', 'owner' => 'Hunterpro Lights', 'description' => 'Інтернет-магазин'],
            ['store' => 'mitraxlp.com', 'store_url' => 'https://mitraxlp.com/', 'owner' => 'Mitrax', 'description' => 'Сайт-візитка'],
            ['store' => 'rb.joie.com.ua', 'store_url' => 'https://rb.joie.com.ua/', 'owner' => 'R&B Team', 'description' => 'Сайт-візитка'],
            ['store' => 'vitoprint.com.ua', 'store_url' => 'https://vitoprint.com.ua/', 'owner' => 'Vitoprint', 'description' => 'Сайт-візитка'],
            ['store' => 'emts.com.ua', 'store_url' => 'https://emts.com.ua/', 'owner' => 'EMTS Ukraine', 'description' => 'Корпоративний портал'],
            ['store' => 'vitus.com.ua', 'store_url' => 'https://vitus.com.ua/', 'owner' => 'Vitus Завод', 'description' => 'Корпоративний сайт'],
            ['store' => 'terminala.com.ua', 'store_url' => 'https://terminala.com.ua/', 'owner' => 'Terminal A', 'description' => 'Лендинг'],
            ['store' => 'warofcontinents.online', 'store_url' => 'https://warofcontinents.online/', 'owner' => 'War of Continents', 'description' => 'Ігровий портал'],
            ['store' => 'svit-akum.com.ua', 'store_url' => 'https://svit-akum.com.ua/', 'owner' => 'Svit Akum', 'description' => 'Сайт-візитка'],
            ['store' => 'bt.joie.com.ua', 'store_url' => 'https://bt.joie.com.ua/', 'owner' => 'BROCK TEAM', 'description' => 'Сайт-візитка'],
            ['store' => 'chp.partners', 'store_url' => 'https://www.chp.partners/', 'owner' => 'CHP Partners', 'description' => 'Корпоративний сайт'],
            ['store' => 'maxbudugai.com', 'store_url' => 'https://www.maxbudugai.com/', 'owner' => 'MAX Budugai', 'description' => 'Медична клініка'],
            ['store' => 'bytekreativ.de', 'store_url' => 'https://bytekreativ.de/', 'owner' => 'Byte Creativ', 'description' => 'Сайт-візитка'],
            ['store' => 'extremecarry.joie.com.ua', 'store_url' => 'https://extremecarry.joie.com.ua/', 'owner' => 'Extremecarry', 'description' => 'Інтернет-магазин'],
            ['store' => 'vladlitvinenko.com', 'store_url' => 'http://vladlitvinenko.com/', 'owner' => 'Vladlitvinenko', 'description' => 'Лендинг-магазин'],
            ['store' => 'automata.com.ua', 'store_url' => 'https://automata.com.ua/', 'owner' => 'Automata', 'description' => 'Сайт-візитка'],
            ['store' => 'ysna.joie.com.ua', 'store_url' => 'https://ysna.joie.com.ua/', 'owner' => 'УСНА', 'description' => 'Корпоративний сайт'],
            ['store' => 'dailyspoon.pl', 'store_url' => 'https://dailyspoon.pl/', 'owner' => 'Daily Spoon', 'description' => 'Інтернет-магазин'],
        ];
    }
}
