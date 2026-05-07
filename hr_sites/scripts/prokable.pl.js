// source: https://prokable.pl/
// extracted: 2026-05-07T21:22:25.745Z
// scripts: 1

// === script #1 (length=539) ===
window.renderOptIn = function() {
    window.gapi.load('surveyoptin', function() {
      window.gapi.surveyoptin.render(
        {
          // REQUIRED FIELDS
          "merchant_id": 649255258,
          "order_id": "ORDER_ID",
          "email": "CUSTOMER_EMAIL",
          "delivery_country": "COUNTRY_CODE",
          "estimated_delivery_date": "YYYY-MM-DD",

          // OPTIONAL FIELDS
          "products": [{"gtin":"GTIN1"}, {"gtin":"GTIN2"}]
          "opt_in_style": "BOTTOM_LEFT_DIALOG"
        });
    });
  }
