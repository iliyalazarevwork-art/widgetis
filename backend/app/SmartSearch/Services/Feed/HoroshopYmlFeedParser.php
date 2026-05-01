<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Feed;

use App\SmartSearch\Exceptions\FeedParseException;
use XMLReader;

final class HoroshopYmlFeedParser implements FeedParser
{
    /**
     * @return \Generator<int, array{type: 'category'|'offer', data: array<string, mixed>}>
     */
    public function parse(string $filePath): \Generator
    {
        $reader = new XMLReader();

        $opened = @$reader->open($filePath);

        if ($opened === false) {
            throw FeedParseException::malformedXml("Cannot open file: {$filePath}");
        }

        $inCategories = false;
        $inOffers = false;

        try {
            while (@$reader->read()) {
                if ($reader->nodeType === XMLReader::ELEMENT) {
                    if ($reader->localName === 'categories') {
                        $inCategories = true;
                        $inOffers = false;
                        continue;
                    }

                    if ($reader->localName === 'offers') {
                        $inOffers = true;
                        $inCategories = false;
                        continue;
                    }

                    if ($inCategories && $reader->localName === 'category') {
                        yield from $this->parseCategory($reader);
                        continue;
                    }

                    if ($inOffers && $reader->localName === 'offer') {
                        yield from $this->parseOffer($reader);
                        continue;
                    }
                }

                if ($reader->nodeType === XMLReader::END_ELEMENT) {
                    if ($reader->localName === 'categories') {
                        $inCategories = false;
                    } elseif ($reader->localName === 'offers') {
                        $inOffers = false;
                    }
                }
            }
        } finally {
            $reader->close();
        }
    }

    /**
     * @return \Generator<int, array{type: 'category', data: array<string, mixed>}>
     */
    private function parseCategory(XMLReader $reader): \Generator
    {
        $externalId = $reader->getAttribute('id') ?? '';
        $parentId = $reader->getAttribute('parentId') ?: null;

        $name = '';
        if (!$reader->isEmptyElement) {
            while (@$reader->read()) {
                if ($reader->nodeType === XMLReader::TEXT || $reader->nodeType === XMLReader::CDATA) {
                    $name .= $reader->value;
                }
                if ($reader->nodeType === XMLReader::END_ELEMENT && $reader->localName === 'category') {
                    break;
                }
            }
        }

        if ($externalId !== '') {
            yield [
                'type' => 'category',
                'data' => [
                    'external_id' => $externalId,
                    'parent_id'   => $parentId,
                    'name'        => trim($name),
                ],
            ];
        }
    }

    /**
     * @return \Generator<int, array{type: 'offer', data: array<string, mixed>}>
     */
    private function parseOffer(XMLReader $reader): \Generator
    {
        $externalId = $reader->getAttribute('id') ?? '';
        $availableAttr = $reader->getAttribute('available') ?? '';
        $available = $this->decodeAvailable($availableAttr);

        // Expand the offer subtree into an owned DOMDocument so it can be safely
        // converted to SimpleXML. Without an explicit document the expanded node
        // has no owner and simplexml_import_dom() throws.
        $dom = new \DOMDocument();
        $node = $reader->expand($dom);

        if (!($node instanceof \DOMNode)) {
            return;
        }

        $dom->appendChild($node);

        /** @var \SimpleXMLElement $xml */
        $xml = simplexml_import_dom($node);

        if (!($xml instanceof \SimpleXMLElement)) {
            return;
        }

        $url = (string) ($xml->url ?? '');
        $price = isset($xml->price) ? (int) $xml->price : null;
        $oldprice = isset($xml->oldprice) ? (int) $xml->oldprice : 0;
        $currencyId = (string) ($xml->currencyId ?? 'UAH');
        $categoryId = (string) ($xml->categoryId ?? '');
        $vendor = (string) ($xml->vendor ?? '');
        $name = (string) ($xml->name ?? '');

        // Take the first picture only
        $picture = '';
        if (isset($xml->picture)) {
            foreach ($xml->picture as $pic) {
                $picture = (string) $pic;
                break;
            }
        }

        // Concatenate all param values into search_text
        $params = [];
        if (isset($xml->param)) {
            foreach ($xml->param as $param) {
                $val = trim((string) $param);
                if ($val !== '') {
                    $params[] = $val;
                }
            }
        }

        if ($externalId !== '') {
            yield [
                'type' => 'offer',
                'data' => [
                    'external_id' => $externalId,
                    'available'   => $available,
                    'url'         => $url,
                    'price'       => $price,
                    'oldprice'    => $oldprice,
                    'currency'    => $currencyId,
                    'category_id' => $categoryId,
                    'vendor'      => $vendor,
                    'name'        => $name,
                    'picture'     => $picture,
                    'params'      => $params,
                ],
            ];
        }
    }

    /**
     * Decode the YML `available` attribute.
     * "" → false, "false"/"0" → false, anything else → true.
     */
    private function decodeAvailable(string $value): bool
    {
        if ($value === '' || $value === 'false' || $value === '0') {
            return false;
        }

        return true;
    }
}
