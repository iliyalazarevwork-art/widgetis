// source: https://blankets.com.ua/
// extracted: 2026-05-07T21:19:39.775Z
// scripts: 1

// === script #1 (length=1818) ===
document.addEventListener('DOMContentLoaded', function () {
  var offers = document.querySelector('[itemprop="offers"]');
  if (!offers) return;

  offers.insertAdjacentHTML('beforeend', `
    <div itemprop="shippingDetails" itemscope itemtype="https://schema.org/OfferShippingDetails">
      <div itemprop="shippingRate" itemscope itemtype="https://schema.org/MonetaryAmount">
        <meta itemprop="maxValue" content="180">
        <meta itemprop="currency" content="UAH">
      </div>
      <div itemprop="shippingDestination" itemscope itemtype="https://schema.org/DefinedRegion">
        <meta itemprop="addressCountry" content="UA">
      </div>
      <div itemprop="deliveryTime" itemscope itemtype="https://schema.org/ShippingDeliveryTime">
        <div itemprop="handlingTime" itemscope itemtype="https://schema.org/QuantitativeValue">
          <meta itemprop="minValue" content="0">
          <meta itemprop="maxValue" content="1">
          <meta itemprop="unitCode" content="DAY">
        </div>
        <div itemprop="transitTime" itemscope itemtype="https://schema.org/QuantitativeValue">
          <meta itemprop="minValue" content="1">
          <meta itemprop="maxValue" content="3">
          <meta itemprop="unitCode" content="DAY">
        </div>
      </div>
    </div>

    <div itemprop="hasMerchantReturnPolicy" itemscope itemtype="https://schema.org/MerchantReturnPolicy">
      <meta itemprop="applicableCountry" content="UA">
      <link itemprop="returnPolicyCategory" href="https://schema.org/MerchantReturnFiniteReturnWindow">
      <meta itemprop="merchantReturnDays" content="14">
      <link itemprop="returnMethod" href="https://schema.org/ReturnByMail">
      <link itemprop="returnFees" href="https://schema.org/FreeReturn">
    </div>
  `);
});
